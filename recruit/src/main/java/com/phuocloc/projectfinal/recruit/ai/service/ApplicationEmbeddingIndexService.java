package com.phuocloc.projectfinal.recruit.ai.service;

import com.phuocloc.projectfinal.recruit.candidate.repository.HoSoChungChiRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.HoSoHocVanRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.HoSoKinhNghiemRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.KyNangUngVienRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.NganhNgheUngVienRepository;
import com.phuocloc.projectfinal.recruit.domain.ai.entity.ChiMucNhungDonUngTuyen;
import com.phuocloc.projectfinal.recruit.domain.ai.repository.ChiMucNhungDonUngTuyenRepository;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.DonUngTuyen;
import com.phuocloc.projectfinal.recruit.infrastructure.qdrant.QdrantClientService;
import com.phuocloc.projectfinal.recruit.infrastructure.qdrant.QdrantProperties;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Đồng bộ chỉ mục nhúng cho đơn ứng tuyển lên Qdrant + bảng ChiMucNhungDonUngTuyen.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ApplicationEmbeddingIndexService {

    private static final String TRANG_THAI_DA_CHI_MUC = "INDEXED";
    private static final String TRANG_THAI_LOI = "FAILED";
    private static final String TRANG_THAI_BO_QUA = "SKIPPED";
    private static final String PHIEN_BAN_NHUNG = "application-v2";
    private static final String NGUON_NHUNG_HO_SO = "PROFILE";

    private final ChiMucNhungDonUngTuyenRepository chiMucRepository;
    private final NganhNgheUngVienRepository nganhNgheRepository;
    private final HoSoHocVanRepository hoSoHocVanRepository;
    private final HoSoKinhNghiemRepository hoSoKinhNghiemRepository;
    private final HoSoChungChiRepository hoSoChungChiRepository;
    private final KyNangUngVienRepository kyNangUngVienRepository;
    private final TextEmbeddingService vanBanNhungService;
    private final QdrantClientService qdrantClientService;
    private final QdrantProperties qdrantProperties;

    /**
     * Đồng bộ embedding cho một đơn ứng tuyển cụ thể.
     *
     * <p>Đơn của tin bắt buộc CV chỉ lưu file để HR tải xem thủ công; không đọc PDF và không đưa vào Qdrant.</p>
     */
    @Transactional
    public void syncIndex(DonUngTuyen donUngTuyen) {
        if (donUngTuyen == null || donUngTuyen.getId() == null || !qdrantClientService.isEnabled()) {
            return;
        }
        String pointId = buildPointId(donUngTuyen.getId());
        if (shouldSkipEmbedding(donUngTuyen)) {
            skipIndex(donUngTuyen, pointId);
            return;
        }
        try {
            String noiDung = buildEmbeddingContent(donUngTuyen);
            List<Float> vector = vanBanNhungService.generateVector(noiDung);
            Map<String, Object> payload = buildPayload(donUngTuyen);
            qdrantClientService.upsertPoint(qdrantProperties.getKhoDonUngTuyen(), pointId, vector, payload);
            saveIndexStatus(donUngTuyen, pointId, TRANG_THAI_DA_CHI_MUC);
        } catch (Exception ex) {
            saveIndexStatus(donUngTuyen, pointId, TRANG_THAI_LOI);
            log.warn("Không đồng bộ được chỉ mục nhúng cho đơn ứng tuyển {}", donUngTuyen.getId(), ex);
        }
    }

    /**
     * Đảm bảo đơn ứng tuyển đã có point trong Qdrant trước khi chạy semantic ranking.
     */
    @Transactional
    public void ensureIndexedForMatching(DonUngTuyen donUngTuyen) {
        if (donUngTuyen == null || donUngTuyen.getId() == null || !qdrantClientService.isEnabled()) {
            return;
        }
        var latestIndex = chiMucRepository.findFirstByDonUngTuyen_IdOrderByIdDesc(donUngTuyen.getId());
        if (shouldSkipEmbedding(donUngTuyen)) {
            if (latestIndex.isPresent() && TRANG_THAI_BO_QUA.equalsIgnoreCase(latestIndex.get().getTrangThai())) {
                return;
            }
            skipIndex(donUngTuyen, buildPointId(donUngTuyen.getId()));
            return;
        }
        if (latestIndex.isPresent()
                && TRANG_THAI_DA_CHI_MUC.equalsIgnoreCase(latestIndex.get().getTrangThai())
                && StringUtils.hasText(latestIndex.get().getMaDiem())
                && qdrantClientService.getPointPayload(qdrantProperties.getKhoDonUngTuyen(), latestIndex.get().getMaDiem())
                        .filter(payload -> isCurrentEmbeddingPayload(payload, resolveEmbeddingSource(donUngTuyen)))
                        .isPresent()) {
            return;
        }
        syncIndex(donUngTuyen);
    }

    /**
     * Xóa point khỏi Qdrant khi ứng viên huỷ đơn ứng tuyển.
     * Lỗi xóa không làm thất bại luồng huỷ đơn.
     */
    public void removeFromIndex(DonUngTuyen donUngTuyen) {
        if (donUngTuyen == null || donUngTuyen.getId() == null || !qdrantClientService.isEnabled()) {
            return;
        }
        try {
            qdrantClientService.deletePoint(qdrantProperties.getKhoDonUngTuyen(), buildPointId(donUngTuyen.getId()));
        } catch (Exception ex) {
            log.debug("Không xóa được point Qdrant khi huỷ đơn ứng tuyển {}", donUngTuyen.getId(), ex);
        }
    }

    /**
     * Ghi log trạng thái index mới để giữ quan hệ 1-nhiều giữa đơn ứng tuyển và lịch sử đồng bộ.
     */
    private void saveIndexStatus(DonUngTuyen donUngTuyen, String maDiem, String trangThai) {
        ChiMucNhungDonUngTuyen chiMuc = new ChiMucNhungDonUngTuyen();
        chiMuc.setDonUngTuyen(donUngTuyen);
        chiMuc.setMaDiem(maDiem);
        chiMuc.setTrangThai(trangThai);
        chiMuc.setNgayTao(LocalDateTime.now());
        chiMucRepository.save(chiMuc);
    }

    /**
     * Tin bắt buộc CV không tham gia ranking tự động theo đơn: HR vẫn xem CV thủ công qua cvUrl.
     */
    private void skipIndex(DonUngTuyen donUngTuyen, String pointId) {
        try {
            qdrantClientService.deletePoint(qdrantProperties.getKhoDonUngTuyen(), pointId);
        } catch (Exception ex) {
            log.debug("Không xóa được point {} khỏi Qdrant khi bỏ qua đơn ứng tuyển {}", pointId, donUngTuyen.getId(), ex);
        }
        saveIndexStatus(donUngTuyen, pointId, TRANG_THAI_BO_QUA);
    }

    private String buildPointId(Integer donUngTuyenId) {
        return UUID.nameUUIDFromBytes(("don-ung-tuyen-" + donUngTuyenId).getBytes(StandardCharsets.UTF_8)).toString();
    }

    /**
     * Payload kèm theo point trong Qdrant để phục vụ filter theo job/profile/application.
     */
    private Map<String, Object> buildPayload(DonUngTuyen donUngTuyen) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("donUngTuyenId", donUngTuyen.getId());
        payload.put("hoSoUngVienId", donUngTuyen.getHoSoUngVien() == null ? null : donUngTuyen.getHoSoUngVien().getId());
        payload.put("tinTuyenDungId", donUngTuyen.getTinTuyenDung() == null ? null : donUngTuyen.getTinTuyenDung().getId());
        payload.put("trangThai", donUngTuyen.getTrangThai());
        payload.put("cvUrl", donUngTuyen.getCvUrl());
        payload.put("nguonNhung", resolveEmbeddingSource(donUngTuyen));
        payload.put("phienBanNhung", PHIEN_BAN_NHUNG);
        payload.put("ngayTao", donUngTuyen.getNgayTao() == null ? null : donUngTuyen.getNgayTao().toString());
        return payload;
    }

    private boolean isCurrentEmbeddingPayload(Map<String, Object> payload, String expectedSource) {
        if (payload == null) {
            return false;
        }
        return PHIEN_BAN_NHUNG.equals(String.valueOf(payload.get("phienBanNhung")))
                && expectedSource.equals(String.valueOf(payload.get("nguonNhung")));
    }

    private String resolveEmbeddingSource(DonUngTuyen donUngTuyen) {
        return NGUON_NHUNG_HO_SO;
    }

    private boolean shouldSkipEmbedding(DonUngTuyen donUngTuyen) {
        return donUngTuyen.getTinTuyenDung() != null
                && Boolean.TRUE.equals(donUngTuyen.getTinTuyenDung().getBatBuocCV())
                && StringUtils.hasText(donUngTuyen.getCvUrl());
    }

    /**
     * Hợp nhất text từ:
     * - hồ sơ ứng viên là nguồn chính
     * - đơn của tin bắt buộc CV được bỏ qua trước khi gọi hàm này
     *
     * Kết quả này là nguồn đầu vào duy nhất cho embedding của DonUngTuyen.
     */
    private String buildEmbeddingContent(DonUngTuyen donUngTuyen) {
        StringBuilder sb = new StringBuilder(1024);

        if (donUngTuyen.getHoSoUngVien() != null) {
            Integer hoSoId = donUngTuyen.getHoSoUngVien().getId();
            append(sb, "Muc tieu nghe nghiep", donUngTuyen.getHoSoUngVien().getMucTieuNgheNghiep());
            append(sb, "Gioi thieu ban than", donUngTuyen.getHoSoUngVien().getGioiThieuBanThan());

            if (hoSoId != null) {
                kyNangUngVienRepository.findByHoSoUngVien_Id(hoSoId).forEach(item -> {
                    if (item.getKyNang() != null) {
                        append(sb, "Ky nang", item.getKyNang().getTen());
                    }
                });
                nganhNgheRepository.findByHoSoUngVien_Id(hoSoId).forEach(item -> {
                    if (item.getNganhNghe() != null) {
                        append(sb, "Nganh nghe quan tam", item.getNganhNghe().getTen());
                    }
                });
                hoSoKinhNghiemRepository.findByHoSoUngVien_IdOrderByKinhNghiem_ThoiGianBatDauDesc(hoSoId).forEach(link -> {
                    var item = link.getKinhNghiem();
                    if (item == null) {
                        return;
                    }
                    append(sb, "Kinh nghiem", item.getChucDanh());
                    append(sb, "Cong ty", item.getTenCongTy());
                    append(sb, "Mo ta cong viec", item.getMoTaCongViec());
                    appendTimeRange(sb, "Thoi gian kinh nghiem", item.getThoiGianBatDau(), item.getThoiGianKetThuc());
                });
                hoSoHocVanRepository.findByHoSoUngVien_IdOrderByHocVan_ThoiGianBatDauDesc(hoSoId).forEach(link -> {
                    var item = link.getHocVan();
                    if (item == null) {
                        return;
                    }
                    append(sb, "Hoc van", item.getBacHoc());
                    append(sb, "Chuyen nganh", item.getChuyenNganh());
                    append(sb, "Truong", item.getTenTruong());
                    appendTimeRange(sb, "Thoi gian hoc", item.getThoiGianBatDau(), item.getThoiGianKetThuc());
                });
                hoSoChungChiRepository.findByHoSoUngVien_IdOrderByChungChi_NgayBatDauDesc(hoSoId).forEach(link -> {
                    var item = link.getChungChi();
                    if (item == null) {
                        return;
                    }
                    append(sb, "Chung chi", item.getTenChungChi());
                    if (item.getLoaiChungChi() != null) {
                        append(sb, "Loai chung chi", item.getLoaiChungChi().getTen());
                    }
                });
            }
        }

        return sb.toString();
    }

    /**
     * Chuẩn hóa chuỗi thời gian để tăng tín hiệu về seniority theo timeline.
     */
    private void appendTimeRange(StringBuilder sb, String label, LocalDate from, LocalDate to) {
        if (from == null && to == null) {
            return;
        }
        sb.append(label).append(": ")
                .append(from == null ? "?" : from)
                .append(" - ")
                .append(to == null ? "nay" : to)
                .append('\n');
    }

    /**
     * Append trường text nếu có dữ liệu hợp lệ.
     */
    private void append(StringBuilder sb, String label, String value) {
        if (!StringUtils.hasText(value)) {
            return;
        }
        sb.append(label).append(": ").append(value.trim()).append('\n');
    }
}

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

    private final ChiMucNhungDonUngTuyenRepository chiMucRepository;
    private final NganhNgheUngVienRepository nganhNgheRepository;
    private final HoSoHocVanRepository hoSoHocVanRepository;
    private final HoSoKinhNghiemRepository hoSoKinhNghiemRepository;
    private final HoSoChungChiRepository hoSoChungChiRepository;
    private final KyNangUngVienRepository kyNangUngVienRepository;
    private final TextEmbeddingService vanBanNhungService;
    private final CvContentExtractionService trichXuatNoiDungCvService;
    private final QdrantClientService qdrantClientService;
    private final QdrantProperties qdrantProperties;

    /**
     * Đồng bộ embedding cho một đơn ứng tuyển cụ thể.
     *
     * <p>Đơn ứng tuyển chứa ngữ cảnh lần apply (CV, profile tại thời điểm nộp đơn, job target),
     * nên được index riêng thay vì chỉ dùng embedding hồ sơ tổng quát.</p>
     */
    @Transactional
    public void dongBoChiMuc(DonUngTuyen donUngTuyen) {
        if (donUngTuyen == null || donUngTuyen.getId() == null || !qdrantClientService.isEnabled()) {
            return;
        }
        String pointId = taoMaDiem(donUngTuyen.getId());
        try {
            String noiDung = ghepNoiDungNhung(donUngTuyen);
            List<Float> vector = vanBanNhungService.taoVector(noiDung);
            Map<String, Object> payload = taoPayload(donUngTuyen);
            qdrantClientService.upsertPoint(qdrantProperties.getKhoDonUngTuyen(), pointId, vector, payload);
            luuTrangThai(donUngTuyen, pointId, TRANG_THAI_DA_CHI_MUC);
        } catch (Exception ex) {
            luuTrangThai(donUngTuyen, pointId, TRANG_THAI_LOI);
            log.warn("Không đồng bộ được chỉ mục nhúng cho đơn ứng tuyển {}", donUngTuyen.getId(), ex);
        }
    }

    /**
     * Ghi log trạng thái index mới để giữ quan hệ 1-nhiều giữa đơn ứng tuyển và lịch sử đồng bộ.
     */
    private void luuTrangThai(DonUngTuyen donUngTuyen, String maDiem, String trangThai) {
        ChiMucNhungDonUngTuyen chiMuc = new ChiMucNhungDonUngTuyen();
        chiMuc.setDonUngTuyen(donUngTuyen);
        chiMuc.setMaDiem(maDiem);
        chiMuc.setTrangThai(trangThai);
        chiMuc.setNgayTao(LocalDateTime.now());
        chiMucRepository.save(chiMuc);
    }

    private String taoMaDiem(Integer donUngTuyenId) {
        return UUID.nameUUIDFromBytes(("don-ung-tuyen-" + donUngTuyenId).getBytes(StandardCharsets.UTF_8)).toString();
    }

    /**
     * Payload kèm theo point trong Qdrant để phục vụ filter theo job/profile/application.
     */
    private Map<String, Object> taoPayload(DonUngTuyen donUngTuyen) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("donUngTuyenId", donUngTuyen.getId());
        payload.put("hoSoUngVienId", donUngTuyen.getHoSoUngVien() == null ? null : donUngTuyen.getHoSoUngVien().getId());
        payload.put("tinTuyenDungId", donUngTuyen.getTinTuyenDung() == null ? null : donUngTuyen.getTinTuyenDung().getId());
        payload.put("trangThai", donUngTuyen.getTrangThai());
        payload.put("cvUrl", donUngTuyen.getCvUrl());
        payload.put("ngayTao", donUngTuyen.getNgayTao() == null ? null : donUngTuyen.getNgayTao().toString());
        return payload;
    }

    /**
     * Hợp nhất text từ:
     * - nội dung CV thật (nếu ứng viên có upload cvUrl)
     * - tin tuyển dụng mục tiêu
     * - hồ sơ ứng viên
     *
     * Kết quả này là nguồn đầu vào duy nhất cho embedding của DonUngTuyen.
     */
    private String ghepNoiDungNhung(DonUngTuyen donUngTuyen) {
        StringBuilder sb = new StringBuilder(1024);

        String noiDungCv = trichXuatNoiDungCvService.trichXuat(donUngTuyen.getCvUrl());
        if (StringUtils.hasText(noiDungCv)) {
            // Ưu tiên text CV vì đây là dữ liệu ứng viên nộp cho chính lần apply này.
            append(sb, "Noi dung CV upload", noiDungCv);
        } else {
            // Vẫn lưu cvUrl vào text để trace/debug khi cần, dù không parse được nội dung.
            append(sb, "Cv URL", donUngTuyen.getCvUrl());
        }

        if (donUngTuyen.getTinTuyenDung() != null) {
            append(sb, "Tieu de tin", donUngTuyen.getTinTuyenDung().getTieuDe());
            append(sb, "Mo ta tin", donUngTuyen.getTinTuyenDung().getMoTa());
            append(sb, "Yeu cau tin", donUngTuyen.getTinTuyenDung().getYeuCau());
            if (donUngTuyen.getTinTuyenDung().getNganhNghe() != null) {
                append(sb, "Nganh nghe tin", donUngTuyen.getTinTuyenDung().getNganhNghe().getTen());
            }
        }

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
                    appendKhoangThoiGian(sb, "Thoi gian kinh nghiem", item.getThoiGianBatDau(), item.getThoiGianKetThuc());
                });
                hoSoHocVanRepository.findByHoSoUngVien_IdOrderByHocVan_ThoiGianBatDauDesc(hoSoId).forEach(link -> {
                    var item = link.getHocVan();
                    if (item == null) {
                        return;
                    }
                    append(sb, "Hoc van", item.getBacHoc());
                    append(sb, "Chuyen nganh", item.getChuyenNganh());
                    append(sb, "Truong", item.getTenTruong());
                    appendKhoangThoiGian(sb, "Thoi gian hoc", item.getThoiGianBatDau(), item.getThoiGianKetThuc());
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
    private void appendKhoangThoiGian(StringBuilder sb, String label, LocalDate from, LocalDate to) {
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

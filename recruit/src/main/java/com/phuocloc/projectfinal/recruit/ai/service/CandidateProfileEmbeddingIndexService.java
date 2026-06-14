package com.phuocloc.projectfinal.recruit.ai.service;

import com.phuocloc.projectfinal.recruit.candidate.repository.HoSoChungChiRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.HoSoHocVanRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.HoSoKinhNghiemRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.CandidateProfileRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.KyNangUngVienRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.NganhNgheUngVienRepository;
import com.phuocloc.projectfinal.recruit.domain.ai.entity.ChiMucNhungHoSoUngVien;
import com.phuocloc.projectfinal.recruit.domain.ai.repository.ChiMucNhungHoSoUngVienRepository;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoUngVien;
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
 * Đồng bộ chỉ mục nhúng cho hồ sơ ứng viên lên Qdrant + bảng ChiMucNhungHoSoUngVien.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CandidateProfileEmbeddingIndexService {

    private static final String TRANG_THAI_DA_CHI_MUC = "INDEXED";
    private static final String TRANG_THAI_LOI = "FAILED";

    private final ChiMucNhungHoSoUngVienRepository chiMucRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final NganhNgheUngVienRepository nganhNgheRepository;
    private final HoSoHocVanRepository hoSoHocVanRepository;
    private final HoSoKinhNghiemRepository hoSoKinhNghiemRepository;
    private final HoSoChungChiRepository hoSoChungChiRepository;
    private final KyNangUngVienRepository kyNangUngVienRepository;
    private final TextEmbeddingService vanBanNhungService;
    private final QdrantClientService qdrantClientService;
    private final QdrantProperties qdrantProperties;

    @Transactional
    public DongBoIndexSummary reindexAllProfiles() {
        if (!qdrantClientService.isEnabled()) {
            return new DongBoIndexSummary(false, 0, 0, 0);
        }
        List<HoSoUngVien> profiles = candidateProfileRepository.findAll().stream()
                .filter(profile -> profile.getNgayXoa() == null)
                .toList();
        int success = 0;
        int failed = 0;
        for (HoSoUngVien profile : profiles) {
            try {
                syncIndex(profile);
                success++;
            } catch (RuntimeException ex) {
                failed++;
                log.warn("Reindex Qdrant thất bại cho hồ sơ ứng viên {}", profile.getId(), ex);
            }
        }
        return new DongBoIndexSummary(true, profiles.size(), success, failed);
    }

    /**
     * Đồng bộ một hồ sơ ứng viên lên vector store.
     *
     * <p>Flow:
     * 1) Gom text hồ sơ.
     * 2) Sinh vector embedding.
     * 3) Upsert vào Qdrant.
     * 4) Lưu trạng thái index trong bảng ChiMucNhungHoSoUngVien.</p>
     */
    @Transactional
    public void syncIndex(HoSoUngVien hoSoUngVien) {
        if (hoSoUngVien == null || hoSoUngVien.getId() == null || !qdrantClientService.isEnabled()) {
            return;
        }
        String pointId = buildPointId(hoSoUngVien.getId());

        try {
            String noiDung = buildEmbeddingContent(hoSoUngVien);
            List<Float> vector = vanBanNhungService.generateVector(noiDung);
            qdrantClientService.upsertPoint(
                    qdrantProperties.getKhoHoSoUngVien(),
                    pointId,
                    vector,
                    buildPayload(hoSoUngVien)
            );
            saveIndexStatus(hoSoUngVien, pointId, TRANG_THAI_DA_CHI_MUC);
        } catch (Exception ex) {
            saveIndexStatus(hoSoUngVien, pointId, TRANG_THAI_LOI);
            log.warn("Không đồng bộ được chỉ mục nhúng cho hồ sơ ứng viên {}", hoSoUngVien.getId(), ex);
        }
    }

    /**
     * Ghi log trạng thái index mới để giữ quan hệ 1-nhiều giữa hồ sơ và lịch sử đồng bộ.
     */
    private void saveIndexStatus(HoSoUngVien hoSoUngVien, String maDiem, String trangThai) {
        ChiMucNhungHoSoUngVien chiMuc = new ChiMucNhungHoSoUngVien();
        chiMuc.setHoSoUngVien(hoSoUngVien);
        chiMuc.setMaDiem(maDiem);
        chiMuc.setTrangThai(trangThai);
        chiMuc.setNgayTao(LocalDateTime.now());
        chiMucRepository.save(chiMuc);
    }

    private String buildPointId(Integer hoSoUngVienId) {
        return UUID.nameUUIDFromBytes(("ho-so-ung-vien-" + hoSoUngVienId).getBytes(StandardCharsets.UTF_8)).toString();
    }

    /**
     * Tạo vector truy vấn từ hồ sơ ứng viên để search các job phù hợp.
     */
    public List<Float> generateQueryVector(HoSoUngVien hoSoUngVien) {
        return vanBanNhungService.generateVector(buildEmbeddingContent(hoSoUngVien));
    }

    /**
     * Lazy-load vector hồ sơ cho matching.
     *
     * <p>Nếu đã có point INDEXED trong Qdrant thì dùng lại vector đó để tránh gọi model Python lặp lại.
     * Nếu point bị mất hoặc chưa từng index, service sẽ tạo mới, upsert và lưu một dòng lịch sử sync.</p>
     */
    @Transactional
    public List<Float> getOrCreateIndexVectorForMatching(HoSoUngVien hoSoUngVien) {
        if (hoSoUngVien == null || hoSoUngVien.getId() == null) {
            throw new IllegalArgumentException("Thiếu hồ sơ ứng viên để tạo vector matching");
        }
        if (!qdrantClientService.isEnabled()) {
            return generateQueryVector(hoSoUngVien);
        }

        var latestIndex = chiMucRepository.findFirstByHoSoUngVien_IdOrderByIdDesc(hoSoUngVien.getId());
        if (latestIndex.isPresent()
                && TRANG_THAI_DA_CHI_MUC.equalsIgnoreCase(latestIndex.get().getTrangThai())
                && StringUtils.hasText(latestIndex.get().getMaDiem())) {
            var existingVector = qdrantClientService.getPointVector(
                    qdrantProperties.getKhoHoSoUngVien(),
                    latestIndex.get().getMaDiem()
            );
            if (existingVector.isPresent()) {
                return existingVector.get();
            }
        }

        String pointId = buildPointId(hoSoUngVien.getId());
        try {
            List<Float> vector = generateQueryVector(hoSoUngVien);
            qdrantClientService.upsertPoint(
                    qdrantProperties.getKhoHoSoUngVien(),
                    pointId,
                    vector,
                    buildPayload(hoSoUngVien)
            );
            saveIndexStatus(hoSoUngVien, pointId, TRANG_THAI_DA_CHI_MUC);
            return vector;
        } catch (Exception ex) {
            saveIndexStatus(hoSoUngVien, pointId, TRANG_THAI_LOI);
            throw ex;
        }
    }

    /**
     * Metadata phụ lưu kèm point trên Qdrant để phục vụ filter/debug.
     */
    private Map<String, Object> buildPayload(HoSoUngVien hoSoUngVien) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("hoSoUngVienId", hoSoUngVien.getId());
        payload.put("nguoiDungId", hoSoUngVien.getNguoiDung() == null ? null : hoSoUngVien.getNguoiDung().getId());
        List<Integer> nganhNgheIds = nganhNgheRepository.findByHoSoUngVien_Id(hoSoUngVien.getId()).stream()
                .filter(item -> item.getNganhNghe() != null)
                .map(item -> item.getNganhNghe().getId())
                .toList();
        if (!nganhNgheIds.isEmpty()) {
            payload.put("nganhNgheIds", nganhNgheIds);
        }
        payload.put("ngayCapNhat", hoSoUngVien.getNgayCapNhat() == null ? null : hoSoUngVien.getNgayCapNhat().toString());
        return payload;
    }

    /**
     * Hợp nhất toàn bộ nội dung hồ sơ thành một text duy nhất trước khi embedding.
     * Cách này giúp vector thể hiện ngữ cảnh tổng thể của ứng viên.
     */
    private String buildEmbeddingContent(HoSoUngVien hoSoUngVien) {
        StringBuilder sb = new StringBuilder(1024);

        append(sb, "Muc tieu nghe nghiep", hoSoUngVien.getMucTieuNgheNghiep());
        append(sb, "Gioi thieu ban than", hoSoUngVien.getGioiThieuBanThan());

        kyNangUngVienRepository.findByHoSoUngVien_Id(hoSoUngVien.getId()).forEach(item -> {
            if (item.getKyNang() != null) {
                append(sb, "Ky nang", item.getKyNang().getTen());
            }
        });
        nganhNgheRepository.findByHoSoUngVien_Id(hoSoUngVien.getId()).forEach(item -> {
            if (item.getNganhNghe() != null) {
                append(sb, "Nganh nghe quan tam", item.getNganhNghe().getTen());
            }
        });
        hoSoKinhNghiemRepository.findByHoSoUngVien_IdOrderByKinhNghiem_ThoiGianBatDauDesc(hoSoUngVien.getId()).forEach(link -> {
            var item = link.getKinhNghiem();
            if (item == null) {
                return;
            }
            append(sb, "Kinh nghiem", item.getChucDanh());
            append(sb, "Cong ty", item.getTenCongTy());
            append(sb, "Mo ta cong viec", item.getMoTaCongViec());
            appendTimeRange(sb, "Thoi gian kinh nghiem", item.getThoiGianBatDau(), item.getThoiGianKetThuc());
        });
        hoSoHocVanRepository.findByHoSoUngVien_IdOrderByHocVan_ThoiGianBatDauDesc(hoSoUngVien.getId()).forEach(link -> {
            var item = link.getHocVan();
            if (item == null) {
                return;
            }
            append(sb, "Hoc van", item.getBacHoc());
            append(sb, "Chuyen nganh", item.getChuyenNganh());
            append(sb, "Truong", item.getTenTruong());
            appendTimeRange(sb, "Thoi gian hoc", item.getThoiGianBatDau(), item.getThoiGianKetThuc());
        });
        hoSoChungChiRepository.findByHoSoUngVien_IdOrderByChungChi_NgayBatDauDesc(hoSoUngVien.getId()).forEach(link -> {
            var item = link.getChungChi();
            if (item == null) {
                return;
            }
            append(sb, "Chung chi", item.getTenChungChi());
            if (item.getLoaiChungChi() != null) {
                append(sb, "Loai chung chi", item.getLoaiChungChi().getTen());
            }
        });

        return sb.toString();
    }

    /**
     * Chuẩn hóa cách ghi mốc thời gian thành chuỗi để model embedding hiểu liên tục quá trình.
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
     * Append cặp nhãn-giá-trị theo format thống nhất.
     */
    private void append(StringBuilder sb, String label, String value) {
        if (!StringUtils.hasText(value)) {
            return;
        }
        sb.append(label).append(": ").append(value.trim()).append('\n');
    }

    public record DongBoIndexSummary(boolean enabled, int tongSo, int soDaDongBo, int soThatBai) {
    }
}

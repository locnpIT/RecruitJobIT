package com.phuocloc.projectfinal.recruit.ai.service;

import com.phuocloc.projectfinal.recruit.domain.ai.entity.ChiMucNhungTinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.ai.repository.ChiMucNhungTinTuyenDungRepository;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.KyNangTinTuyenDungRepository;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.TinTuyenDungRepository;
import com.phuocloc.projectfinal.recruit.infrastructure.qdrant.QdrantClientService;
import com.phuocloc.projectfinal.recruit.infrastructure.qdrant.QdrantProperties;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Đồng bộ chỉ mục nhúng cho tin tuyển dụng lên Qdrant + bảng ChiMucNhungTinTuyenDung.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class JobEmbeddingIndexService {

    private static final String TRANG_THAI_DA_CHI_MUC = "INDEXED";
    private static final String TRANG_THAI_TAM_DUNG = "INACTIVE";
    private static final String TRANG_THAI_LOI = "FAILED";

    private final ChiMucNhungTinTuyenDungRepository chiMucRepository;
    private final TinTuyenDungRepository tinTuyenDungRepository;
    private final KyNangTinTuyenDungRepository kyNangTinTuyenDungRepository;
    private final TextEmbeddingService vanBanNhungService;
    private final QdrantClientService qdrantClientService;
    private final QdrantProperties qdrantProperties;

    @Transactional
    public DongBoIndexSummary reindexAllPublicJobs() {
        if (!qdrantClientService.isEnabled()) {
            return new DongBoIndexSummary(false, 0, 0, 0);
        }
        List<TinTuyenDung> jobs = tinTuyenDungRepository.findPublicApprovedActiveJobs(LocalDateTime.now());
        int success = 0;
        int failed = 0;
        for (TinTuyenDung job : jobs) {
            try {
                syncOrDeactivateIndex(job);
                success++;
            } catch (RuntimeException ex) {
                failed++;
                log.warn("Reindex Qdrant thất bại cho tin tuyển dụng {}", job.getId(), ex);
            }
        }
        return new DongBoIndexSummary(true, jobs.size(), success, failed);
    }

    /**
     * Đồng bộ hoặc tạm dừng index cho một tin tuyển dụng.
     *
     * <p>Chỉ index các tin đang được phép hiển thị public (`APPROVED`, chưa xóa mềm).
     * Các tin còn lại sẽ bị rút khỏi vector store để tránh xuất hiện trong kết quả semantic.</p>
     */
    @Transactional
    public void syncOrDeactivateIndex(TinTuyenDung tinTuyenDung) {
        if (tinTuyenDung == null || tinTuyenDung.getId() == null || !qdrantClientService.isEnabled()) {
            return;
        }
        String pointId = buildPointId(tinTuyenDung.getId());

        // Chỉ index tin đang hoạt động public; còn lại xóa khỏi vector store để kết quả semantic sạch.
        if (!isActiveForSearch(tinTuyenDung)) {
            try {
                qdrantClientService.deletePoint(qdrantProperties.getKhoTinTuyenDung(), pointId);
            } catch (Exception ex) {
                log.debug("Không xóa được point {} khỏi Qdrant (có thể chưa tồn tại)", pointId, ex);
            }
            saveIndexStatus(tinTuyenDung, pointId, TRANG_THAI_TAM_DUNG);
            return;
        }

        try {
            String noiDung = buildEmbeddingContent(tinTuyenDung);
            List<Float> vector = vanBanNhungService.generateVector(noiDung);
            qdrantClientService.upsertPoint(
                    qdrantProperties.getKhoTinTuyenDung(),
                    pointId,
                    vector,
                    buildPayload(tinTuyenDung)
            );
            saveIndexStatus(tinTuyenDung, pointId, TRANG_THAI_DA_CHI_MUC);
        } catch (Exception ex) {
            saveIndexStatus(tinTuyenDung, pointId, TRANG_THAI_LOI);
            log.warn("Không đồng bộ được chỉ mục nhúng cho tin tuyển dụng {}", tinTuyenDung.getId(), ex);
        }
    }

    /**
     * Rule active của semantic search job.
     */
    private boolean isActiveForSearch(TinTuyenDung tinTuyenDung) {
        return tinTuyenDung.getNgayXoa() == null && "APPROVED".equalsIgnoreCase(tinTuyenDung.getTrangThai());
    }

    /**
     * Ghi log trạng thái index mới để giữ quan hệ 1-nhiều giữa tin tuyển dụng và lịch sử đồng bộ.
     */
    private void saveIndexStatus(TinTuyenDung tinTuyenDung, String maDiem, String trangThai) {
        ChiMucNhungTinTuyenDung chiMuc = new ChiMucNhungTinTuyenDung();
        chiMuc.setTinTuyenDung(tinTuyenDung);
        chiMuc.setMaDiem(maDiem);
        chiMuc.setTrangThai(trangThai);
        chiMuc.setNgayTao(LocalDateTime.now());
        chiMucRepository.save(chiMuc);
    }

    private String buildPointId(Integer tinTuyenDungId) {
        return UUID.nameUUIDFromBytes(("tin-tuyen-dung-" + tinTuyenDungId).getBytes(StandardCharsets.UTF_8)).toString();
    }

    /**
     * Tạo vector truy vấn cho một job bất kỳ, kể cả job chưa APPROVED.
     * Dùng cho matching nội bộ HR, không phụ thuộc trạng thái public index.
     */
    public List<Float> generateQueryVector(TinTuyenDung tinTuyenDung) {
        return vanBanNhungService.generateVector(buildEmbeddingContent(tinTuyenDung));
    }

    /**
     * Lazy-load vector tin tuyển dụng cho luồng HR matching.
     *
     * <p>Nếu bảng chỉ mục đã ghi nhận point INDEXED và Qdrant còn giữ vector thì dùng lại vector đó.
     * Nếu chưa có chỉ mục hoặc point đã mất khỏi Qdrant, service sẽ tạo embedding một lần,
     * upsert vào collection tin tuyển dụng và lưu thêm một dòng lịch sử sync trong DB.</p>
     */
    @Transactional
    public List<Float> getOrCreateIndexVectorForMatching(TinTuyenDung tinTuyenDung) {
        if (tinTuyenDung == null || tinTuyenDung.getId() == null) {
            throw new IllegalArgumentException("Thiếu tin tuyển dụng để tạo vector matching");
        }
        if (!qdrantClientService.isEnabled()) {
            return generateQueryVector(tinTuyenDung);
        }

        var latestIndex = chiMucRepository.findFirstByTinTuyenDung_IdOrderByIdDesc(tinTuyenDung.getId());
        if (latestIndex.isPresent()
                && TRANG_THAI_DA_CHI_MUC.equalsIgnoreCase(latestIndex.get().getTrangThai())
                && StringUtils.hasText(latestIndex.get().getMaDiem())) {
            var existingVector = qdrantClientService.getPointVector(
                    qdrantProperties.getKhoTinTuyenDung(),
                    latestIndex.get().getMaDiem()
            );
            if (existingVector.isPresent()) {
                return existingVector.get();
            }
        }

        String pointId = buildPointId(tinTuyenDung.getId());
        try {
            List<Float> vector = generateQueryVector(tinTuyenDung);
            qdrantClientService.upsertPoint(
                    qdrantProperties.getKhoTinTuyenDung(),
                    pointId,
                    vector,
                    buildPayload(tinTuyenDung)
            );
            saveIndexStatus(tinTuyenDung, pointId, TRANG_THAI_DA_CHI_MUC);
            return vector;
        } catch (Exception ex) {
            saveIndexStatus(tinTuyenDung, pointId, TRANG_THAI_LOI);
            throw ex;
        }
    }

    /**
     * Payload phụ trợ của point để dùng khi filter/debug trên Qdrant.
     */
    private Map<String, Object> buildPayload(TinTuyenDung tinTuyenDung) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("tinTuyenDungId", tinTuyenDung.getId());
        payload.put("trangThai", tinTuyenDung.getTrangThai());
        payload.put("nganhNghe", tinTuyenDung.getNganhNghe() == null ? null : tinTuyenDung.getNganhNghe().getTen());
        payload.put("congTy", tinTuyenDung.getChiNhanh() == null || tinTuyenDung.getChiNhanh().getCongTy() == null
                ? null
                : tinTuyenDung.getChiNhanh().getCongTy().getTen());
        payload.put("ngayCapNhat", tinTuyenDung.getNgayCapNhat() == null ? null : tinTuyenDung.getNgayCapNhat().toString());
        return payload;
    }

    /**
     * Gom toàn bộ thông tin job thành text ngữ nghĩa:
     * mô tả/yêu cầu/phúc lợi, metadata nghề nghiệp, địa điểm, kỹ năng.
     */
    private String buildEmbeddingContent(TinTuyenDung tinTuyenDung) {
        StringBuilder sb = new StringBuilder(1024);
        append(sb, "Tieu de", tinTuyenDung.getTieuDe());
        append(sb, "Mo ta", tinTuyenDung.getMoTa());
        append(sb, "Yeu cau", tinTuyenDung.getYeuCau());
        append(sb, "Phuc loi", tinTuyenDung.getPhucLoi());
        append(sb, "Nganh nghe", tinTuyenDung.getNganhNghe() == null ? null : tinTuyenDung.getNganhNghe().getTen());
        append(sb, "Loai hinh lam viec", tinTuyenDung.getLoaiHinhLamViec() == null ? null : tinTuyenDung.getLoaiHinhLamViec().getTen());
        append(sb, "Cap do kinh nghiem", tinTuyenDung.getCapDoKinhNghiem() == null ? null : tinTuyenDung.getCapDoKinhNghiem().getTen());
        append(sb, "Cong ty", tinTuyenDung.getChiNhanh() == null || tinTuyenDung.getChiNhanh().getCongTy() == null
                ? null
                : tinTuyenDung.getChiNhanh().getCongTy().getTen());
        append(sb, "Chi nhanh", tinTuyenDung.getChiNhanh() == null ? null : tinTuyenDung.getChiNhanh().getTen());
        append(sb, "Dia chi chi tiet", tinTuyenDung.getChiNhanh() == null ? null : tinTuyenDung.getChiNhanh().getDiaChiChiTiet());
        if (tinTuyenDung.getChiNhanh() != null && tinTuyenDung.getChiNhanh().getXaPhuong() != null) {
            append(sb, "Xa phuong", tinTuyenDung.getChiNhanh().getXaPhuong().getTen());
            if (tinTuyenDung.getChiNhanh().getXaPhuong().getTinhThanh() != null) {
                append(sb, "Tinh thanh", tinTuyenDung.getChiNhanh().getXaPhuong().getTinhThanh().getTen());
            }
        }
        append(sb, "Luong toi thieu", tinTuyenDung.getLuongToiThieu() == null ? null : tinTuyenDung.getLuongToiThieu().toString());
        append(sb, "Luong toi da", tinTuyenDung.getLuongToiDa() == null ? null : tinTuyenDung.getLuongToiDa().toString());
        append(sb, "So luong tuyen", tinTuyenDung.getSoLuongTuyen() == null ? null : tinTuyenDung.getSoLuongTuyen().toString());
        append(sb, "Bat buoc cv", Boolean.TRUE.equals(tinTuyenDung.getBatBuocCV()) ? "co" : "khong");

        kyNangTinTuyenDungRepository.findByTinTuyenDungIdOrderByKyNangTenAsc(tinTuyenDung.getId()).forEach(item -> {
            if (item.getKyNang() != null) {
                append(sb, "Ky nang", item.getKyNang().getTen());
            }
        });

        return sb.toString();
    }

    /**
     * Append trường text theo format thống nhất trước khi embedding.
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

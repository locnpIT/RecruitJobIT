package com.phuocloc.projectfinal.recruit.ai.service;

import com.phuocloc.projectfinal.recruit.domain.ai.entity.ChiMucNhungKinhNghiem;
import com.phuocloc.projectfinal.recruit.domain.ai.repository.ChiMucNhungKinhNghiemRepository;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.KinhNghiemLamViecUngVien;
import com.phuocloc.projectfinal.recruit.infrastructure.qdrant.QdrantClientService;
import com.phuocloc.projectfinal.recruit.infrastructure.qdrant.QdrantProperties;
import com.phuocloc.projectfinal.recruit.infrastructure.qdrant.QdrantSearchResult;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Quản lý vòng đời embedding của {@link KinhNghiemLamViecUngVien} trong Qdrant.
 *
 * <p>Mỗi kinh nghiệm được embed thành 1 point riêng trong collection {@code khoKinhNghiem}.
 * Payload lưu {@code kinhNghiemId} và {@code nguoiDungId} để filter khi search.
 * Pattern giống hệt {@code CandidateProfileEmbeddingIndexService} và {@code JobEmbeddingIndexService}.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KinhNghiemEmbeddingIndexService {

    private static final String TRANG_THAI_DA_CHI_MUC = "INDEXED";
    private static final String TRANG_THAI_LOI = "ERROR";
    private static final double NGUONG_LIEN_QUAN_MAC_DINH = 0.52;

    private final TextEmbeddingService vanBanNhungService;
    private final QdrantClientService qdrantClientService;
    private final QdrantProperties qdrantProperties;
    private final ChiMucNhungKinhNghiemRepository chiMucRepository;

    // ─── Public API ─────────────────────────────────────────────────────────────

    /**
     * Embed và upsert kinh nghiệm vào Qdrant.
     * Gọi sau khi tạo hoặc cập nhật kinh nghiệm. Lỗi embedding không làm thất bại thao tác chính.
     */
    @Transactional
    public void syncIndex(KinhNghiemLamViecUngVien kinhNghiem) {
        syncIndexInternal(kinhNghiem);
    }

    /**
     * Embed kinh nghiệm và trả về kết quả để luồng admin backfill thống kê chính xác.
     */
    @Transactional
    public boolean syncIndexWithResult(KinhNghiemLamViecUngVien kinhNghiem) {
        return syncIndexInternal(kinhNghiem);
    }

    private boolean syncIndexInternal(KinhNghiemLamViecUngVien kinhNghiem) {
        if (kinhNghiem == null || kinhNghiem.getId() == null || !qdrantClientService.isEnabled()) {
            return false;
        }
        String noiDung = buildEmbeddingContent(kinhNghiem);
        if (!StringUtils.hasText(noiDung)) {
            return false;
        }
        String pointId = buildPointId(kinhNghiem.getId());
        try {
            List<Float> vector = vanBanNhungService.generateVector(noiDung);
            qdrantClientService.upsertPoint(
                    qdrantProperties.getKhoKinhNghiem(),
                    pointId,
                    vector,
                    buildPayload(kinhNghiem)
            );
            saveIndexStatus(kinhNghiem, pointId, TRANG_THAI_DA_CHI_MUC);
            log.debug("Đã index kinh nghiệm {} vào Qdrant", kinhNghiem.getId());
            return true;
        } catch (Exception ex) {
            saveIndexStatus(kinhNghiem, pointId, TRANG_THAI_LOI);
            log.warn("Không đồng bộ được embedding kinh nghiệm {}", kinhNghiem.getId(), ex);
            return false;
        }
    }

    /**
     * Xóa point khỏi Qdrant và dọn log khi ứng viên xóa kinh nghiệm.
     */
    public void deleteIndex(Integer kinhNghiemId) {
        if (kinhNghiemId == null || !qdrantClientService.isEnabled()) {
            return;
        }
        try {
            qdrantClientService.deletePoint(qdrantProperties.getKhoKinhNghiem(), buildPointId(kinhNghiemId));
        } catch (Exception ex) {
            log.debug("Không xóa được point Qdrant cho kinh nghiệm {} (có thể chưa tồn tại)", kinhNghiemId, ex);
        }
        try {
            chiMucRepository.deleteByKinhNghiem_Id(kinhNghiemId);
        } catch (Exception ex) {
            log.warn("Không xóa được log index kinh nghiệm {}", kinhNghiemId, ex);
        }
    }

    /**
     * Tìm danh sách kinh nghiệm của ứng viên có ngữ nghĩa gần với job.
     *
     * <p>Search Qdrant với job vector, filter theo {@code nguoiDungId},
     * chỉ giữ kết quả có score >= {@code NGUONG_LIEN_QUAN_MAC_DINH}, tối đa 3 mục.
     * Trả về chuỗi mô tả dạng "Chức danh tại Công ty (N năm) — X% phù hợp".</p>
     *
     * @param jobVector      Vector của job (đã được tính trước trong luồng matching)
     * @param nguoiDungId    ID người dùng để filter chỉ kinh nghiệm của ứng viên đó
     * @param experienceById Map kinhNghiemId → entity để lấy thông tin label
     */
    public List<String> findRelevantExperiences(
            List<Float> jobVector,
            Integer nguoiDungId,
            Map<Integer, KinhNghiemLamViecUngVien> experienceById
    ) {
        if (!qdrantClientService.isEnabled() || jobVector == null || jobVector.isEmpty() || nguoiDungId == null) {
            return List.of();
        }
        try {
            List<QdrantSearchResult> results = qdrantClientService.searchPoints(
                    qdrantProperties.getKhoKinhNghiem(),
                    jobVector,
                    10,
                    Map.of("nguoiDungId", nguoiDungId)
            );
            return results.stream()
                    .filter(r -> r.score() >= NGUONG_LIEN_QUAN_MAC_DINH)
                    .limit(3)
                    .map(r -> {
                        Integer kinhNghiemId = intPayload(r.payload(), "kinhNghiemId");
                        KinhNghiemLamViecUngVien exp = experienceById.get(kinhNghiemId);
                        return exp != null ? formatLabel(exp, r.score()) : null;
                    })
                    .filter(Objects::nonNull)
                    .toList();
        } catch (Exception ex) {
            log.warn("Không tìm được kinh nghiệm liên quan từ Qdrant cho nguoiDungId={}", nguoiDungId, ex);
            return List.of();
        }
    }

    // ─── Private helpers ────────────────────────────────────────────────────────

    /**
     * UUID deterministic từ kinhNghiemId — idempotent upsert.
     */
    private String buildPointId(Integer kinhNghiemId) {
        return UUID.nameUUIDFromBytes(
                ("kinh-nghiem-" + kinhNghiemId).getBytes(StandardCharsets.UTF_8)
        ).toString();
    }

    /**
     * Nội dung embed: chức danh + tên công ty + mô tả công việc.
     * Ngắn gọn, đủ ngữ cảnh nghề nghiệp để model phân biệt ngành.
     */
    private String buildEmbeddingContent(KinhNghiemLamViecUngVien kinhNghiem) {
        StringBuilder sb = new StringBuilder(512);
        append(sb, kinhNghiem.getChucDanh());
        append(sb, kinhNghiem.getTenCongTy());
        append(sb, kinhNghiem.getMoTaCongViec());
        return sb.toString().trim();
    }

    private void append(StringBuilder sb, String value) {
        if (StringUtils.hasText(value)) {
            sb.append(value.trim()).append('\n');
        }
    }

    /**
     * Payload Qdrant — đủ để filter theo người dùng và tra cứu entity khi map label.
     */
    private Map<String, Object> buildPayload(KinhNghiemLamViecUngVien kinhNghiem) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("kinhNghiemId", kinhNghiem.getId());
        payload.put("nguoiDungId", kinhNghiem.getNguoiDung() == null ? null : kinhNghiem.getNguoiDung().getId());
        payload.put("chucDanh", kinhNghiem.getChucDanh());
        payload.put("tenCongTy", kinhNghiem.getTenCongTy());
        return payload;
    }

    private void saveIndexStatus(KinhNghiemLamViecUngVien kinhNghiem, String maDiem, String trangThai) {
        ChiMucNhungKinhNghiem chiMuc = new ChiMucNhungKinhNghiem();
        chiMuc.setKinhNghiem(kinhNghiem);
        chiMuc.setMaDiem(maDiem);
        chiMuc.setTrangThai(trangThai);
        chiMuc.setNgayTao(LocalDateTime.now());
        chiMucRepository.save(chiMuc);
    }

    /**
     * Tạo chuỗi mô tả kinh nghiệm cho UI — không có keyword hardcode, hoạt động mọi ngành.
     * Ví dụ: "SEO Manager tại Agency ABC (2 năm) — 78% phù hợp"
     */
    private String formatLabel(KinhNghiemLamViecUngVien exp, double score) {
        String title = StringUtils.hasText(exp.getChucDanh())
                ? exp.getChucDanh().trim() : "Kinh nghiệm làm việc";
        String company = StringUtils.hasText(exp.getTenCongTy())
                ? exp.getTenCongTy().trim() : "chưa rõ công ty";
        String duration = formatDuration(exp.getThoiGianBatDau(), exp.getThoiGianKetThuc());
        int pct = (int) Math.round(score * 100);

        StringBuilder sb = new StringBuilder();
        sb.append(title).append(" tại ").append(company);
        if (StringUtils.hasText(duration)) {
            sb.append(" (").append(duration).append(")");
        }
        sb.append(" — ").append(pct).append("% phù hợp");
        return sb.toString();
    }

    private String formatDuration(LocalDate from, LocalDate to) {
        if (from == null) {
            return "";
        }
        LocalDate end = to == null ? LocalDate.now() : to;
        if (end.isBefore(from)) {
            return "";
        }
        long months = Math.max(1, ChronoUnit.MONTHS.between(
                from.withDayOfMonth(1), end.withDayOfMonth(1)));
        long years = months / 12;
        long rem = months % 12;
        if (years > 0 && rem > 0) {
            return years + " năm " + rem + " tháng";
        }
        if (years > 0) {
            return years + " năm";
        }
        return months + " tháng";
    }

    private Integer intPayload(Map<String, Object> payload, String key) {
        if (payload == null) {
            return null;
        }
        Object val = payload.get(key);
        if (val instanceof Integer i) {
            return i;
        }
        if (val instanceof Number n) {
            return n.intValue();
        }
        if (val instanceof String s) {
            try {
                return Integer.parseInt(s);
            } catch (NumberFormatException ignored) {
                // fall through
            }
        }
        return null;
    }
}

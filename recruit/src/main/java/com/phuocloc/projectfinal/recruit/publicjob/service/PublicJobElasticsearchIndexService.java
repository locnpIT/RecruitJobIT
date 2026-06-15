package com.phuocloc.projectfinal.recruit.publicjob.service;

import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.KyNangTinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.KyNangTinTuyenDungRepository;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.TinTuyenDungRepository;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.LoaiHinhLamViec;
import com.phuocloc.projectfinal.recruit.infrastructure.elasticsearch.ElasticsearchClientService;
import com.phuocloc.projectfinal.recruit.infrastructure.elasticsearch.ElasticsearchProperties;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ChiNhanhCongTy;

/**
 * Đồng bộ index Elasticsearch cho tin tuyển dụng public.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PublicJobElasticsearchIndexService {

    private final TinTuyenDungRepository tinTuyenDungRepository;
    private final KyNangTinTuyenDungRepository kyNangTinTuyenDungRepository;
    private final ElasticsearchClientService elasticsearchClientService;
    private final ElasticsearchProperties elasticsearchProperties;

    /**
     * Backfill index khi app khởi động để tránh index rỗng sau deploy/restart.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional(readOnly = true)
    public void reindexAllOnStartup() {
        DongBoIndexSummary summary = reindexAllPublicJobs();
        if (summary.isEnabled()) {
            log.info("Elasticsearch startup reindex: tongTinPublic={}, daDongBo={}, thatBai={}",
                    summary.getTongTinPublic(),
                    summary.getSoDaDongBo(),
                    summary.getSoThatBai());
        }
    }

    /**
     * Reindex full danh sách tin public đang active.
     * Method này dùng cho cả startup hook và admin-trigger reindex thủ công.
     */
    @Transactional(readOnly = true)
    public DongBoIndexSummary reindexAllPublicJobs() {
        if (!elasticsearchClientService.isEnabled()) {
            return new DongBoIndexSummary(false, 0, 0, 0);
        }
        List<TinTuyenDung> publicJobs = tinTuyenDungRepository.findPublicApprovedActiveJobs(LocalDateTime.now());
        int soDaDongBo = 0;
        int soThatBai = 0;
        for (TinTuyenDung job : publicJobs) {
            try {
                syncOrDelete(job);
                soDaDongBo++;
            } catch (Exception ex) {
                soThatBai++;
                log.warn("Không backfill được job {} vào Elasticsearch", job.getId(), ex);
            }
        }
        return new DongBoIndexSummary(true, publicJobs.size(), soDaDongBo, soThatBai);
    }

    /**
     * Đồng bộ point khi job đủ điều kiện public; nếu không đủ thì xóa khỏi index.
     */
    @Transactional(readOnly = true)
    public void syncOrDelete(TinTuyenDung job) {
        if (job == null || job.getId() == null || !elasticsearchClientService.isEnabled()) {
            return;
        }
        String documentId = buildDocumentId(job.getId());
        if (!isPublicJobActive(job)) {
            elasticsearchClientService.deleteDocument(elasticsearchProperties.getJobIndex(), documentId);
            return;
        }
        elasticsearchClientService.upsertDocument(
                elasticsearchProperties.getJobIndex(),
                documentId,
                buildDocument(job)
        );
    }

    private String buildDocumentId(Integer jobId) {
        return "job-" + jobId;
    }

    /**
     * Rule active cho search public phải khớp với rule hiển thị public của hệ thống.
     */
    private boolean isPublicJobActive(TinTuyenDung job) {
        if (job.getNgayXoa() != null) {
            return false;
        }
        if (!"APPROVED".equalsIgnoreCase(job.getTrangThai())) {
            return false;
        }
        if (job.getDenHanLuc() != null && job.getDenHanLuc().isBefore(LocalDateTime.now())) {
            return false;
        }
        ChiNhanhCongTy branch = job.firstBranch();
        if (branch == null || branch.getCongTy() == null) {
            return false;
        }
        if (branch.getCongTy().getNgayXoa() != null) {
            return false;
        }
        return "APPROVED".equalsIgnoreCase(branch.getCongTy().getTrangThai());
    }

    /**
     * Chuẩn hóa document field để query keyword/filter/sort trên Elasticsearch.
     */
    private Map<String, Object> buildDocument(TinTuyenDung job) {
        Map<String, Object> document = new LinkedHashMap<>();
        document.put("tieuDe", trimToEmpty(job.getTieuDe()));
        document.put("moTa", trimToEmpty(job.getMoTa()));
        document.put("yeuCau", trimToEmpty(job.getYeuCau()));
        document.put("phucLoi", trimToEmpty(job.getPhucLoi()));
        ChiNhanhCongTy branch = job.firstBranch();
        document.put("congTyTen", branch == null || branch.getCongTy() == null
                ? ""
                : trimToEmpty(branch.getCongTy().getTen()));
        document.put("nganhNgheTen", job.getNganhNghe() == null ? "" : trimToEmpty(job.getNganhNghe().getTen()));
        document.put("capDoKinhNghiemTen", job.getCapDoKinhNghiem() == null ? "" : trimToEmpty(job.getCapDoKinhNghiem().getTen()));
        List<LoaiHinhLamViec> workTypes = job.getEffectiveWorkTypes();
        document.put("loaiHinhLamViecTen", joinWorkTypeNames(workTypes));
        document.put("kyNangs", joinSkills(job.getId()));
        document.put("tinhThanhTen", resolveTinhThanh(job));
        document.put("xaPhuongTen", resolveXaPhuong(job));
        document.put("nganhNgheId", job.getNganhNghe() == null ? null : job.getNganhNghe().getId());
        document.put("loaiHinhLamViecId", workTypes.stream()
                .map(LoaiHinhLamViec::getId)
                .filter(java.util.Objects::nonNull)
                .toList());
        document.put("capDoKinhNghiemId", job.getCapDoKinhNghiem() == null ? null : job.getCapDoKinhNghiem().getId());
        document.put("luongToiThieu", job.getLuongToiThieu());
        document.put("luongToiDa", job.getLuongToiDa());
        document.put("denHanLuc", job.getDenHanLuc() == null ? null : job.getDenHanLuc().toString());
        document.put("ngayTao", job.getNgayTao() == null ? null : job.getNgayTao().toString());
        return document;
    }

    private String joinSkills(Integer jobId) {
        if (jobId == null) {
            return "";
        }
        return kyNangTinTuyenDungRepository.findByTinTuyenDungIdOrderByKyNangTenAsc(jobId).stream()
                .map(KyNangTinTuyenDung::getKyNang)
                .filter(item -> item != null && StringUtils.hasText(item.getTen()))
                .map(item -> item.getTen().trim())
                .distinct()
                .reduce((left, right) -> left + ", " + right)
                .orElse("");
    }

    private String joinWorkTypeNames(List<LoaiHinhLamViec> workTypes) {
        return workTypes.stream()
                .map(LoaiHinhLamViec::getTen)
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .reduce((left, right) -> left + ", " + right)
                .orElse("");
    }

    private String resolveTinhThanh(TinTuyenDung job) {
        if (job.getChiNhanhs() == null || job.getChiNhanhs().isEmpty()) return "";
        return job.getChiNhanhs().stream()
                .filter(java.util.Objects::nonNull)
                .filter(b -> b.getXaPhuong() != null && b.getXaPhuong().getTinhThanh() != null)
                .map(b -> b.getXaPhuong().getTinhThanh().getTen())
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .reduce((a, b) -> a + ", " + b)
                .orElse("");
    }

    private String resolveXaPhuong(TinTuyenDung job) {
        if (job.getChiNhanhs() == null || job.getChiNhanhs().isEmpty()) return "";
        return job.getChiNhanhs().stream()
                .filter(java.util.Objects::nonNull)
                .filter(b -> b.getXaPhuong() != null)
                .map(b -> b.getXaPhuong().getTen())
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .reduce((a, b) -> a + ", " + b)
                .orElse("");
    }

    private String trimToEmpty(String value) {
        return StringUtils.hasText(value) ? value.trim() : "";
    }

    @Getter
    @AllArgsConstructor
    public static class DongBoIndexSummary {
        private boolean enabled;
        private int tongTinPublic;
        private int soDaDongBo;
        private int soThatBai;
    }
}

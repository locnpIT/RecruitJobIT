package com.phuocloc.projectfinal.recruit.publicjob.service;

import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.KyNangTinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.KyNangTinTuyenDungRepository;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.TinTuyenDungRepository;
import com.phuocloc.projectfinal.recruit.infrastructure.elasticsearch.ElasticsearchClientService;
import com.phuocloc.projectfinal.recruit.infrastructure.elasticsearch.ElasticsearchProperties;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
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
    public void dongBoToanBoTinPublicKhiKhoiDong() {
        DongBoIndexSummary summary = dongBoToanBoTinPublic();
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
    public DongBoIndexSummary dongBoToanBoTinPublic() {
        if (!elasticsearchClientService.isEnabled()) {
            return new DongBoIndexSummary(false, 0, 0, 0);
        }
        List<TinTuyenDung> publicJobs = tinTuyenDungRepository.findPublicApprovedActiveJobs(LocalDateTime.now());
        int soDaDongBo = 0;
        int soThatBai = 0;
        for (TinTuyenDung job : publicJobs) {
            try {
                dongBoHoacXoa(job);
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
    public void dongBoHoacXoa(TinTuyenDung job) {
        if (job == null || job.getId() == null || !elasticsearchClientService.isEnabled()) {
            return;
        }
        String documentId = taoDocumentId(job.getId());
        if (!laTinPublicHoatDong(job)) {
            elasticsearchClientService.deleteDocument(elasticsearchProperties.getJobIndex(), documentId);
            return;
        }
        elasticsearchClientService.upsertDocument(
                elasticsearchProperties.getJobIndex(),
                documentId,
                taoDocument(job)
        );
    }

    private String taoDocumentId(Integer jobId) {
        return "job-" + jobId;
    }

    /**
     * Rule active cho search public phải khớp với rule hiển thị public của hệ thống.
     */
    private boolean laTinPublicHoatDong(TinTuyenDung job) {
        if (job.getNgayXoa() != null) {
            return false;
        }
        if (!"APPROVED".equalsIgnoreCase(job.getTrangThai())) {
            return false;
        }
        if (job.getDenHanLuc() != null && job.getDenHanLuc().isBefore(LocalDateTime.now())) {
            return false;
        }
        if (job.getChiNhanh() == null || job.getChiNhanh().getCongTy() == null) {
            return false;
        }
        if (job.getChiNhanh().getCongTy().getNgayXoa() != null) {
            return false;
        }
        return "APPROVED".equalsIgnoreCase(job.getChiNhanh().getCongTy().getTrangThai());
    }

    /**
     * Chuẩn hóa document field để query keyword/filter/sort trên Elasticsearch.
     */
    private Map<String, Object> taoDocument(TinTuyenDung job) {
        Map<String, Object> document = new LinkedHashMap<>();
        document.put("jobId", taoDocumentId(job.getId()));
        document.put("tieuDe", trimToEmpty(job.getTieuDe()));
        document.put("moTa", trimToEmpty(job.getMoTa()));
        document.put("yeuCau", trimToEmpty(job.getYeuCau()));
        document.put("phucLoi", trimToEmpty(job.getPhucLoi()));
        document.put("congTyTen", job.getChiNhanh() == null || job.getChiNhanh().getCongTy() == null
                ? ""
                : trimToEmpty(job.getChiNhanh().getCongTy().getTen()));
        document.put("nganhNgheTen", job.getNganhNghe() == null ? "" : trimToEmpty(job.getNganhNghe().getTen()));
        document.put("kyNangs", ghepKyNang(job.getId()));
        document.put("diaDiem", resolveDiaDiem(job));
        document.put("tinhThanhTen", resolveTinhThanh(job));
        document.put("xaPhuongTen", resolveXaPhuong(job));
        document.put("trangThai", trimToEmpty(job.getTrangThai()).toUpperCase());
        document.put("congTyTrangThai", job.getChiNhanh() == null || job.getChiNhanh().getCongTy() == null
                ? ""
                : trimToEmpty(job.getChiNhanh().getCongTy().getTrangThai()).toUpperCase());
        document.put("nganhNgheId", job.getNganhNghe() == null ? null : job.getNganhNghe().getId());
        document.put("loaiHinhLamViecId", job.getLoaiHinhLamViec() == null ? null : job.getLoaiHinhLamViec().getId());
        document.put("capDoKinhNghiemId", job.getCapDoKinhNghiem() == null ? null : job.getCapDoKinhNghiem().getId());
        document.put("luongToiThieu", job.getLuongToiThieu());
        document.put("luongToiDa", job.getLuongToiDa());
        // Tin không có hạn (denHanLuc = null) dùng mốc rất lớn để luôn pass filter hạn.
        document.put("denHanLucEpoch", toDeadlineEpoch(job.getDenHanLuc()));
        document.put("ngayTaoEpoch", toEpochSecond(job.getNgayTao()));
        document.put("ngayCapNhatEpoch", toEpochSecond(job.getNgayCapNhat()));
        return document;
    }

    private String ghepKyNang(Integer jobId) {
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

    private String resolveDiaDiem(TinTuyenDung job) {
        String xaPhuong = resolveXaPhuong(job);
        String tinhThanh = resolveTinhThanh(job);
        if (StringUtils.hasText(xaPhuong) && StringUtils.hasText(tinhThanh)) {
            return xaPhuong + ", " + tinhThanh;
        }
        return StringUtils.hasText(tinhThanh) ? tinhThanh : xaPhuong;
    }

    private String resolveTinhThanh(TinTuyenDung job) {
        if (job.getChiNhanh() == null
                || job.getChiNhanh().getXaPhuong() == null
                || job.getChiNhanh().getXaPhuong().getTinhThanh() == null) {
            return "";
        }
        return trimToEmpty(job.getChiNhanh().getXaPhuong().getTinhThanh().getTen());
    }

    private String resolveXaPhuong(TinTuyenDung job) {
        if (job.getChiNhanh() == null || job.getChiNhanh().getXaPhuong() == null) {
            return "";
        }
        return trimToEmpty(job.getChiNhanh().getXaPhuong().getTen());
    }

    private long toEpochSecond(LocalDateTime value) {
        if (value == null) {
            return 0L;
        }
        return value.toEpochSecond(ZoneOffset.UTC);
    }

    private long toDeadlineEpoch(LocalDateTime value) {
        if (value == null) {
            return Long.MAX_VALUE;
        }
        return value.toEpochSecond(ZoneOffset.UTC);
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

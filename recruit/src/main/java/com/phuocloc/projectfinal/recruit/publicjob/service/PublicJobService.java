package com.phuocloc.projectfinal.recruit.publicjob.service;

import com.phuocloc.projectfinal.recruit.domain.nghenghiep.repository.CapDoKinhNghiemRepository;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.repository.LoaiHinhLamViecRepository;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.repository.NganhNgheRepository;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.TinTuyenDungRepository;
import com.phuocloc.projectfinal.recruit.publicjob.dto.response.PublicJobDetailResponse;
import com.phuocloc.projectfinal.recruit.publicjob.dto.response.PublicJobSearchMetadataResponse;
import com.phuocloc.projectfinal.recruit.publicjob.dto.response.PublicJobSearchResponse;
import com.phuocloc.projectfinal.recruit.publicjob.dto.response.PublicJobSummaryResponse;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
/**
 * Service public cho tin tuyển dụng.
 *
 * <p>Luồng public chỉ được phép trả về tin đã được Admin duyệt, chưa xóa mềm,
 * chưa hết hạn và thuộc công ty đã được duyệt. Điều này đảm bảo ứng viên không
 * thấy tin nháp, tin bị từ chối hoặc tin của công ty chưa xác minh.</p>
 */
public class PublicJobService {

    private static final int DEFAULT_LIMIT = 8;
    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 12;
    private static final int SIMILAR_LIMIT = 4;

    private final TinTuyenDungRepository tinTuyenDungRepository;
    private final NganhNgheRepository nganhNgheRepository;
    private final LoaiHinhLamViecRepository loaiHinhLamViecRepository;
    private final CapDoKinhNghiemRepository capDoKinhNghiemRepository;
    private final PublicJobElasticsearchSearchService publicJobElasticsearchSearchService;
    private final PublicJobMapper mapper;
    private final JobSearchTextAnalyzer textAnalyzer;

    @Transactional(readOnly = true)
    public List<PublicJobSummaryResponse> listJobs(String keyword, String location, Integer limit) {
        int safeLimit = limit == null || limit <= 0 ? DEFAULT_LIMIT : Math.min(limit, 30);
        PublicJobSearchResponse result = searchJobs(keyword, location, null, null, null, DEFAULT_PAGE, safeLimit);
        return result.getDanhSach();
    }

    @Transactional(readOnly = true)
    public PublicJobSearchResponse searchJobs(
            String tuKhoa,
            String diaDiem,
            Integer nganhNgheId,
            Integer loaiHinhLamViecId,
            Integer capDoKinhNghiemId,
            Integer trang,
            Integer kichThuoc
    ) {
        int safePage = publicJobElasticsearchSearchService.normalizePage(trang == null ? DEFAULT_PAGE : trang);
        int safeSize = publicJobElasticsearchSearchService.normalizeSize(kichThuoc == null ? DEFAULT_SIZE : kichThuoc);

        if (publicJobElasticsearchSearchService.isEnabled()) {
            var esResult = publicJobElasticsearchSearchService.searchJobIds(
                    tuKhoa, diaDiem, nganhNgheId, loaiHinhLamViecId, capDoKinhNghiemId, safePage, safeSize);
            List<PublicJobSummaryResponse> data = mapSummaryFromSearchDocumentIds(esResult.getDocumentIds());
            long total = esResult.getTotal();
            return PublicJobSearchResponse.builder()
                    .danhSach(data)
                    .tongSo(total)
                    .trang(safePage)
                    .kichThuoc(safeSize)
                    .conTrangSau((safePage + 1L) * safeSize < total)
                    .build();
        }

        // Fallback local khi Elasticsearch chưa bật: vẫn giữ API hoạt động ổn định cho môi trường dev.
        var all = searchWithJpa(tuKhoa, diaDiem, nganhNgheId, loaiHinhLamViecId, capDoKinhNghiemId);
        int from = safePage * safeSize;
        if (from >= all.size()) {
            return PublicJobSearchResponse.builder()
                    .danhSach(List.of())
                    .tongSo(all.size())
                    .trang(safePage)
                    .kichThuoc(safeSize)
                    .conTrangSau(false)
                    .build();
        }
        int to = Math.min(from + safeSize, all.size());
        return PublicJobSearchResponse.builder()
                .danhSach(all.subList(from, to).stream().map(mapper::mapSummary).toList())
                .tongSo(all.size())
                .trang(safePage)
                .kichThuoc(safeSize)
                .conTrangSau(to < all.size())
                .build();
    }

    @Transactional(readOnly = true)
    public PublicJobSearchResponse searchJobsForAi(
            String tuKhoa,
            String diaDiem,
            Integer luongToiThieuMongMuon,
            Integer luongToiDaMongMuon,
            String capDoKinhNghiemText,
            String loaiHinhLamViecText,
            Boolean remote,
            Boolean khongYeuCauKinhNghiem,
            String tuKhoaLoaiTru,
            Integer kichThuoc,
            Integer trang
    ) {
        int safeSize = publicJobElasticsearchSearchService.normalizeSize(kichThuoc == null ? DEFAULT_SIZE : kichThuoc);
        int safePage = publicJobElasticsearchSearchService.normalizePage(trang);

        if (publicJobElasticsearchSearchService.isEnabled()) {
            var esResult = publicJobElasticsearchSearchService.searchJobIdsForAi(
                    tuKhoa, diaDiem, luongToiThieuMongMuon, luongToiDaMongMuon,
                    capDoKinhNghiemText, loaiHinhLamViecText, remote, khongYeuCauKinhNghiem,
                    tuKhoaLoaiTru, safePage, safeSize);
            List<PublicJobSummaryResponse> data = mapSummaryFromSearchDocumentIds(esResult.getDocumentIds());
            long total = esResult.getTotal();
            return PublicJobSearchResponse.builder()
                    .danhSach(data)
                    .tongSo(total)
                    .trang(safePage)
                    .kichThuoc(safeSize)
                    .conTrangSau((safePage + 1L) * safeSize < total)
                    .build();
        }

        var all = searchWithJpa(tuKhoa, diaDiem, null, null, null).stream()
                .filter(job -> mapper.matchesSalary(job, luongToiThieuMongMuon, luongToiDaMongMuon))
                .filter(job -> mapper.matchesTextOption(resolveExperienceLevel(job), capDoKinhNghiemText))
                .filter(job -> mapper.matchesTextOption(resolveWorkType(job), loaiHinhLamViecText))
                .filter(job -> mapper.matchesRemote(job, remote))
                .filter(job -> mapper.matchesNoExperienceRequired(job, khongYeuCauKinhNghiem))
                .filter(job -> !mapper.matchesExcludedKeywords(job, tuKhoaLoaiTru))
                .toList();
        int from = safePage * safeSize;
        if (from >= all.size()) {
            return PublicJobSearchResponse.builder()
                    .danhSach(List.of())
                    .tongSo(all.size())
                    .trang(safePage)
                    .kichThuoc(safeSize)
                    .conTrangSau(false)
                    .build();
        }
        int to = Math.min(from + safeSize, all.size());
        return PublicJobSearchResponse.builder()
                .danhSach(all.subList(from, to).stream().map(mapper::mapSummary).toList())
                .tongSo(all.size())
                .trang(safePage)
                .kichThuoc(safeSize)
                .conTrangSau(to < all.size())
                .build();
    }

    @Transactional(readOnly = true)
    public PublicJobSearchMetadataResponse getSearchMetadata() {
        return PublicJobSearchMetadataResponse.builder()
                .nganhNghes(nganhNgheRepository.findAll(Sort.by(Sort.Direction.ASC, "ten")).stream().map(mapper::mapOption).toList())
                .loaiHinhLamViecs(loaiHinhLamViecRepository.findAll(Sort.by(Sort.Direction.ASC, "ten")).stream().map(mapper::mapOption).toList())
                .capDoKinhNghiems(capDoKinhNghiemRepository.findAll(Sort.by(Sort.Direction.ASC, "ten")).stream().map(mapper::mapOption).toList())
                .build();
    }

    @Transactional(readOnly = true)
    public PublicJobDetailResponse getJobDetail(Long jobId) {
        TinTuyenDung job = requirePublicJob(jobId);
        List<PublicJobSummaryResponse> similarJobs = tinTuyenDungRepository
                .findPublicApprovedActiveJobs(LocalDateTime.now()).stream()
                .filter(item -> !Objects.equals(item.getId(), job.getId()))
                .filter(item -> mapper.sameIndustry(item, job) || mapper.sameLocation(item, job))
                .limit(SIMILAR_LIMIT)
                .map(mapper::mapSummary)
                .toList();
        return mapper.mapDetail(job, similarJobs);
    }

    public TinTuyenDung requirePublicJob(Long jobId) {
        if (jobId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "jobId không được để trống");
        }
        return tinTuyenDungRepository.findPublicApprovedActiveJobById(Math.toIntExact(jobId), LocalDateTime.now())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tin tuyển dụng đang hiển thị"));
    }

    /** Delegation cho {@link CandidateFavoriteJobService} và {@link PublicCompanyService}. */
    public PublicJobSummaryResponse mapSummary(TinTuyenDung job) {
        return mapper.mapSummary(job);
    }

    /** Delegation cho {@link CandidateFavoriteJobService}. */
    public boolean isPublicVisible(TinTuyenDung job) {
        return mapper.isPublicVisible(job);
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    private List<TinTuyenDung> searchWithJpa(
            String tuKhoa,
            String diaDiem,
            Integer nganhNgheId,
            Integer loaiHinhLamViecId,
            Integer capDoKinhNghiemId
    ) {
        String normalizedKeyword = textAnalyzer.normalize(tuKhoa);
        String normalizedLocation = textAnalyzer.normalize(diaDiem);
        return tinTuyenDungRepository.findPublicApprovedActiveJobs(LocalDateTime.now()).stream()
                .filter(job -> mapper.matchesKeyword(job, normalizedKeyword))
                .filter(job -> mapper.matchesLocation(job, normalizedLocation))
                .filter(job -> nganhNgheId == null || (job.getNganhNghe() != null && Objects.equals(job.getNganhNghe().getId(), nganhNgheId)))
                .filter(job -> matchesWorkType(job, loaiHinhLamViecId))
                .filter(job -> capDoKinhNghiemId == null || (job.getCapDoKinhNghiem() != null && Objects.equals(job.getCapDoKinhNghiem().getId(), capDoKinhNghiemId)))
                .toList();
    }

    private boolean matchesWorkType(TinTuyenDung job, Integer loaiHinhLamViecId) {
        if (loaiHinhLamViecId == null) {
            return true;
        }
        if (job.getLoaiHinhLamViecs() != null && !job.getLoaiHinhLamViecs().isEmpty()) {
            return job.getLoaiHinhLamViecs().stream()
                    .filter(Objects::nonNull)
                    .anyMatch(item -> Objects.equals(item.getId(), loaiHinhLamViecId));
        }
        return job.getLoaiHinhLamViec() != null && Objects.equals(job.getLoaiHinhLamViec().getId(), loaiHinhLamViecId);
    }

    private List<PublicJobSummaryResponse> mapSummaryFromSearchDocumentIds(List<String> documentIds) {
        if (documentIds == null || documentIds.isEmpty()) {
            return List.of();
        }
        List<Integer> jobIds = documentIds.stream()
                .map(this::parseJobIdFromDocumentId)
                .filter(Objects::nonNull)
                .toList();
        if (jobIds.isEmpty()) {
            return List.of();
        }

        List<TinTuyenDung> jobs = tinTuyenDungRepository.findPublicApprovedActiveJobsByIds(jobIds, LocalDateTime.now());
        Map<Integer, TinTuyenDung> jobMap = new LinkedHashMap<>();
        for (TinTuyenDung job : jobs) {
            if (job.getId() != null) {
                jobMap.put(job.getId(), job);
            }
        }
        return jobIds.stream()
                .map(jobMap::get)
                .filter(Objects::nonNull)
                .map(mapper::mapSummary)
                .toList();
    }

    private Integer parseJobIdFromDocumentId(String documentId) {
        if (!StringUtils.hasText(documentId)) {
            return null;
        }
        String normalized = documentId.trim();
        if (!normalized.startsWith("job-")) {
            return null;
        }
        try {
            return Integer.parseInt(normalized.substring(4));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String resolveExperienceLevel(TinTuyenDung job) {
        return job.getCapDoKinhNghiem() == null ? "" : (job.getCapDoKinhNghiem().getTen() == null ? "" : job.getCapDoKinhNghiem().getTen());
    }

    private String resolveWorkType(TinTuyenDung job) {
        if (job.getLoaiHinhLamViecs() != null && !job.getLoaiHinhLamViecs().isEmpty()) {
            return job.getLoaiHinhLamViecs().stream()
                    .filter(Objects::nonNull)
                    .map(item -> item.getTen() == null ? "" : item.getTen())
                    .filter(StringUtils::hasText)
                    .distinct()
                    .collect(java.util.stream.Collectors.joining(", "));
        }
        return job.getLoaiHinhLamViec() == null ? "" : (job.getLoaiHinhLamViec().getTen() == null ? "" : job.getLoaiHinhLamViec().getTen());
    }
}

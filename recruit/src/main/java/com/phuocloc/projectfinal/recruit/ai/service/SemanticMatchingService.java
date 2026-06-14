package com.phuocloc.projectfinal.recruit.ai.service;

import com.phuocloc.projectfinal.recruit.ai.dto.response.CandidateSemanticMatchResponse;
import com.phuocloc.projectfinal.recruit.ai.dto.response.JobSemanticMatchResponse;
import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.candidate.repository.CandidateProfileRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.HoSoChungChiRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.HoSoHocVanRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.HoSoKinhNghiemRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.KyNangUngVienRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.NganhNgheUngVienRepository;
import com.phuocloc.projectfinal.recruit.company.service.CompanyAdminAccessService;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ChiNhanhCongTy;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.LoaiHinhLamViec;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.DonUngTuyen;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.DonUngTuyenRepository;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.KyNangTinTuyenDungRepository;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.TinTuyenDungRepository;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoUngVien;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.KinhNghiemLamViecUngVien;
import com.phuocloc.projectfinal.recruit.infrastructure.qdrant.QdrantClientService;
import com.phuocloc.projectfinal.recruit.infrastructure.qdrant.QdrantProperties;
import com.phuocloc.projectfinal.recruit.infrastructure.qdrant.QdrantSearchResult;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Service semantic matching hai chiều:
 * - HR tìm hồ sơ ứng viên phù hợp với job.
 * - Candidate tìm job phù hợp với hồ sơ.
 */
@Service
@RequiredArgsConstructor
public class SemanticMatchingService {

    private static final List<String> COMPANY_ADMIN_ROLES = List.of("OWNER", "HR");
    private static final int DEFAULT_LIMIT = 10;
    private static final int MAX_LIMIT = 50;

    private final TinTuyenDungRepository tinTuyenDungRepository;
    private final DonUngTuyenRepository donUngTuyenRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final KyNangUngVienRepository kyNangUngVienRepository;
    private final NganhNgheUngVienRepository nganhNgheUngVienRepository;
    private final HoSoHocVanRepository hoSoHocVanRepository;
    private final HoSoKinhNghiemRepository hoSoKinhNghiemRepository;
    private final HoSoChungChiRepository hoSoChungChiRepository;
    private final KyNangTinTuyenDungRepository kyNangTinTuyenDungRepository;
    private final CompanyAdminAccessService accessService;
    private final JobEmbeddingIndexService jobEmbeddingIndexService;
    private final CandidateProfileEmbeddingIndexService candidateProfileEmbeddingIndexService;
    private final SemanticCandidateExplanationService explanationService;
    private final SemanticMatchSignalService signalService;
    private final SemanticMatchScoringService scoringService;
    private final QdrantClientService qdrantClientService;
    private final QdrantProperties qdrantProperties;

    @Transactional
    public List<CandidateSemanticMatchResponse> findMatchingCandidatesForJob(
            AppUserPrinciple principal,
            Long jobId,
            Integer limit
    ) {
        requireQdrantEnabled();
        Integer normalizedJobId = toIntId(jobId, "jobId");
        TinTuyenDung job = tinTuyenDungRepository.findById(normalizedJobId)
                .filter(item -> item.getNgayXoa() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tin tuyển dụng"));

        requireMembershipForAnyJobBranch(requireUserId(principal), job);

        List<Float> queryVector = jobEmbeddingIndexService.getOrCreateIndexVectorForMatching(job);
        List<QdrantSearchResult> results = qdrantClientService.searchPoints(
                qdrantProperties.getKhoHoSoUngVien(),
                queryVector,
                normalizeLimit(limit) * 2
        );

        Map<Integer, QdrantSearchResult> resultByProfileId = new LinkedHashMap<>();
        results.forEach(result -> {
            Integer profileId = intPayload(result.payload(), "hoSoUngVienId");
            if (profileId != null) {
                resultByProfileId.putIfAbsent(profileId, result);
            }
        });

        if (resultByProfileId.isEmpty()) {
            return List.of();
        }

        Map<Integer, HoSoUngVien> profiles = new LinkedHashMap<>();
        candidateProfileRepository.findByIdInAndNgayXoaIsNull(resultByProfileId.keySet().stream().toList())
                .forEach(profile -> profiles.put(profile.getId(), profile));

        return resultByProfileId.entrySet().stream()
                .map(entry -> mapCandidateMatch(job, profiles.get(entry.getKey()), entry.getValue(), queryVector))
                .filter(Objects::nonNull)
                .sorted(matchScoreComparator())
                .limit(normalizeLimit(limit))
                .toList();
    }

    @Transactional
    public List<CandidateSemanticMatchResponse> findSubmittedApplicationMatchesForJob(
            AppUserPrinciple principal,
            Long jobId,
            Integer limit
    ) {
        requireQdrantEnabled();
        Integer normalizedJobId = toIntId(jobId, "jobId");
        TinTuyenDung job = tinTuyenDungRepository.findById(normalizedJobId)
                .filter(item -> item.getNgayXoa() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tin tuyển dụng"));

        requireMembershipForAnyJobBranch(requireUserId(principal), job);

        List<DonUngTuyen> applications = donUngTuyenRepository
                .findByTinTuyenDung_IdAndNgayXoaIsNullOrderByNgayTaoDesc(normalizedJobId);
        if (applications.isEmpty()) {
            return List.of();
        }

        // Dùng khoHoSoUngVien thay vì collection riêng — vector hồ sơ là nguồn duy nhất,
        // filter theo danh sách hoSoUngVienId của những người đã nộp đơn vào job này.
        Map<Integer, DonUngTuyen> applicationByProfileId = new LinkedHashMap<>();
        applications.forEach(app -> {
            if (app.getHoSoUngVien() != null && app.getHoSoUngVien().getId() != null) {
                applicationByProfileId.putIfAbsent(app.getHoSoUngVien().getId(), app);
            }
        });

        if (applicationByProfileId.isEmpty()) {
            return List.of();
        }

        List<Float> queryVector = jobEmbeddingIndexService.getOrCreateIndexVectorForMatching(job);
        List<Integer> profileIds = new ArrayList<>(applicationByProfileId.keySet());
        List<QdrantSearchResult> results = qdrantClientService.searchPointsByPayloadIds(
                qdrantProperties.getKhoHoSoUngVien(),
                queryVector,
                Math.max(normalizeLimit(limit), 1),
                "hoSoUngVienId",
                profileIds
        );

        return results.stream()
                .map(result -> mapSubmittedApplicationMatch(
                        job,
                        applicationByProfileId.get(intPayload(result.payload(), "hoSoUngVienId")),
                        result,
                        queryVector))
                .filter(Objects::nonNull)
                .sorted(matchScoreComparator())
                .limit(normalizeLimit(limit))
                .toList();
    }

    @Transactional
    public List<JobSemanticMatchResponse> findMatchingJobsForProfile(Long userId, Long profileId, Integer limit) {
        requireQdrantEnabled();
        Integer normalizedProfileId = toIntId(profileId, "profileId");
        HoSoUngVien profile = candidateProfileRepository
                .findByIdAndNguoiDung_Id(normalizedProfileId, toIntId(userId, "userId"))
                .filter(item -> item.getNgayXoa() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ ứng viên"));

        List<Float> queryVector = candidateProfileEmbeddingIndexService.getOrCreateIndexVectorForMatching(profile);
        List<QdrantSearchResult> results = qdrantClientService.searchPoints(
                qdrantProperties.getKhoTinTuyenDung(),
                queryVector,
                normalizeLimit(limit) * 2
        );

        Map<Integer, QdrantSearchResult> resultByJobId = new LinkedHashMap<>();
        results.forEach(result -> {
            Integer jobId = intPayload(result.payload(), "tinTuyenDungId");
            if (jobId != null) {
                resultByJobId.putIfAbsent(jobId, result);
            }
        });

        if (resultByJobId.isEmpty()) {
            return List.of();
        }

        Map<Integer, TinTuyenDung> jobs = new LinkedHashMap<>();
        tinTuyenDungRepository
                .findPublicApprovedActiveJobsByIds(resultByJobId.keySet(), LocalDateTime.now())
                .forEach(job -> jobs.put(job.getId(), job));

        List<String> candidateSkills = signalService.candidateSkillNames(profile.getId());
        List<String> candidateIndustries = signalService.candidateIndustryNames(profile.getId());
        boolean hasProfileExperience = !signalService.profileExperiences(profile.getId()).isEmpty();
        boolean hasProfileSummary = signalService.hasText(profile.getGioiThieuBanThan())
                || signalService.hasText(profile.getMucTieuNgheNghiep());

        return resultByJobId.entrySet().stream()
                .map(entry -> mapJobMatch(
                        candidateSkills,
                        candidateIndustries,
                        hasProfileExperience,
                        hasProfileSummary,
                        jobs.get(entry.getKey()),
                        entry.getValue()
                ))
                .filter(Objects::nonNull)
                .sorted(jobScoreComparator())
                .limit(normalizeLimit(limit))
                .toList();
    }

    private CandidateSemanticMatchResponse mapCandidateMatch(
            TinTuyenDung job, HoSoUngVien profile, QdrantSearchResult result, List<Float> jobVector) {
        if (profile == null || profile.getNguoiDung() == null || !Boolean.TRUE.equals(profile.getNguoiDung().getDangHoatDong())) {
            return null;
        }
        var user = profile.getNguoiDung();
        double semanticPercent = toPercent(result.score());
        CandidateMatchExplanation explanation = explanationService.buildCandidateExplanation(job, profile, semanticPercent, jobVector);
        return CandidateSemanticMatchResponse.builder()
                .hoSoUngVienId(toLong(profile.getId()))
                .nguoiDungId(toLong(user.getId()))
                .tenHoSo(profile.getTenHoSo())
                .ungVienHoTen(joinName(user.getHo(), user.getTen()))
                .email(user.getEmail())
                .soDienThoai(user.getSoDienThoai())
                .anhDaiDienUrl(user.getAnhDaiDienUrl())
                .mucTieuNgheNghiep(profile.getMucTieuNgheNghiep())
                .gioiThieuBanThan(profile.getGioiThieuBanThan())
                .diemPhuHop(explanation.diemPhuHop())
                .lyDoPhuHop(explanation.lyDoPhuHop())
                .tinHieuKhop(explanation.tinHieuKhop())
                .diemManh(explanation.diemManh())
                .kinhNghiemLienQuan(explanation.kinhNghiemLienQuan())
                .canKiemTraThem(explanation.canKiemTraThem())
                .goiYHanhDong(explanation.goiYHanhDong())
                .build();
    }

    private CandidateSemanticMatchResponse mapSubmittedApplicationMatch(
            TinTuyenDung job, DonUngTuyen application, QdrantSearchResult result, List<Float> jobVector) {
        if (application == null || application.getHoSoUngVien() == null) {
            return null;
        }
        HoSoUngVien profile = application.getHoSoUngVien();
        if (profile.getNguoiDung() == null || !Boolean.TRUE.equals(profile.getNguoiDung().getDangHoatDong())) {
            return null;
        }

        var user = profile.getNguoiDung();
        double semanticPercent = toPercent(result.score());
        CandidateMatchExplanation explanation = explanationService.buildCandidateExplanation(job, profile, semanticPercent, jobVector);
        return CandidateSemanticMatchResponse.builder()
                .donUngTuyenId(toLong(application.getId()))
                .hoSoUngVienId(toLong(profile.getId()))
                .nguoiDungId(toLong(user.getId()))
                .tenHoSo(profile.getTenHoSo())
                .ungVienHoTen(joinName(user.getHo(), user.getTen()))
                .email(user.getEmail())
                .soDienThoai(user.getSoDienThoai())
                .anhDaiDienUrl(user.getAnhDaiDienUrl())
                .trangThaiDonUngTuyen(application.getTrangThai())
                .cvUrl(application.getCvUrl())
                .tieuDeTinTuyenDung(job == null ? null : job.getTieuDe())
                .mucTieuNgheNghiep(profile.getMucTieuNgheNghiep())
                .gioiThieuBanThan(profile.getGioiThieuBanThan())
                .diemPhuHop(explanation.diemPhuHop())
                .lyDoPhuHop(explanation.lyDoPhuHop())
                .tinHieuKhop(explanation.tinHieuKhop())
                .diemManh(explanation.diemManh())
                .kinhNghiemLienQuan(explanation.kinhNghiemLienQuan())
                .canKiemTraThem(explanation.canKiemTraThem())
                .goiYHanhDong(explanation.goiYHanhDong())
                .build();
    }

    private JobSemanticMatchResponse mapJobMatch(
            List<String> candidateSkills,
            List<String> candidateIndustries,
            boolean hasProfileExperience,
            boolean hasProfileSummary,
            TinTuyenDung job,
            QdrantSearchResult result
    ) {
        if (job == null) {
            return null;
        }
        var branch = firstBranch(job);
        var company = branch == null ? null : branch.getCongTy();
        List<String> requiredSkills = signalService.jobSignals(job.getId());
        List<String> matchedSkills = signalService.matchedNames(requiredSkills, candidateSkills);
        double semanticPercent = toPercent(result.score());
        double diemPhuHop = scoringService.scoreJobForProfile(
                semanticPercent,
                requiredSkills,
                matchedSkills,
                job.getNganhNghe() == null ? null : job.getNganhNghe().getTen(),
                candidateIndustries,
                hasProfileExperience,
                hasProfileSummary
        );
        return JobSemanticMatchResponse.builder()
                .tinTuyenDungId(toLong(job.getId()))
                .tieuDe(job.getTieuDe())
                .trangThai(job.getTrangThai())
                .congTyTen(company == null ? null : company.getTen())
                .congTyLogoUrl(company == null ? null : company.getLogoUrl())
                .chiNhanhTen(branch == null ? null : branch.getTen())
                .diaDiem(resolveLocation(job))
                .nganhNghe(job.getNganhNghe() == null ? null : job.getNganhNghe().getTen())
                .loaiHinhLamViec(resolveWorkTypeText(job))
                .capDoKinhNghiem(job.getCapDoKinhNghiem() == null ? null : job.getCapDoKinhNghiem().getTen())
                .denHanLuc(job.getDenHanLuc())
                .diemPhuHop(diemPhuHop)
                .tinHieuKhop(matchedSkills.isEmpty() ? requiredSkills : matchedSkills)
                .canKiemTraThem(signalService.jobGaps(job))
                .build();
    }

    private String resolveLocation(TinTuyenDung job) {
        ChiNhanhCongTy branch = firstBranch(job);
        if (branch == null) {
            return null;
        }
        if (branch.getXaPhuong() != null && branch.getXaPhuong().getTinhThanh() != null) {
            return branch.getXaPhuong().getTen() + ", " + branch.getXaPhuong().getTinhThanh().getTen();
        }
        return branch.getDiaChiChiTiet();
    }

    private void requireMembershipForAnyJobBranch(Integer userId, TinTuyenDung job) {
        if (job == null || job.getChiNhanhs() == null || job.getChiNhanhs().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tin tuyển dụng chưa gắn chi nhánh hợp lệ");
        }
        ResponseStatusException lastFailure = null;
        for (ChiNhanhCongTy branch : job.getChiNhanhs()) {
            if (branch == null || branch.getId() == null) {
                continue;
            }
            try {
                accessService.requireMembership(userId, branch.getId(), COMPANY_ADMIN_ROLES);
                return;
            } catch (ResponseStatusException ex) {
                lastFailure = ex;
            }
        }
        if (lastFailure != null) {
            throw lastFailure;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tin tuyển dụng chưa gắn chi nhánh hợp lệ");
    }

    private ChiNhanhCongTy firstBranch(TinTuyenDung job) {
        if (job == null || job.getChiNhanhs() == null) {
            return null;
        }
        return job.getChiNhanhs().stream().findFirst().orElse(null);
    }

    private String resolveWorkTypeText(TinTuyenDung job) {
        if (job == null) {
            return null;
        }
        List<LoaiHinhLamViec> workTypes = job.getLoaiHinhLamViecs() == null || job.getLoaiHinhLamViecs().isEmpty()
                ? (job.getLoaiHinhLamViec() == null ? List.of() : List.of(job.getLoaiHinhLamViec()))
                : job.getLoaiHinhLamViecs().stream().filter(Objects::nonNull).toList();
        String joined = workTypes.stream()
                .map(LoaiHinhLamViec::getTen)
                .filter(text -> text != null && !text.isBlank())
                .distinct()
                .collect(java.util.stream.Collectors.joining(", "));
        return joined.isBlank() ? null : joined;
    }

    private void requireQdrantEnabled() {
        if (!qdrantClientService.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Qdrant chưa được bật");
        }
    }

    private int normalizeLimit(Integer limit) {
        if (limit == null || limit <= 0) {
            return DEFAULT_LIMIT;
        }
        return Math.min(limit, MAX_LIMIT);
    }

    private Integer requireUserId(AppUserPrinciple principal) {
        if (principal == null || principal.getUserId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bạn cần đăng nhập");
        }
        return principal.getUserId().intValue();
    }

    private Integer toIntId(Long value, String fieldName) {
        if (value == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu " + fieldName);
        }
        return value.intValue();
    }

    private Integer intPayload(Map<String, Object> payload, String key) {
        Object value = payload == null ? null : payload.get(key);
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value instanceof String text) {
            try {
                return Integer.parseInt(text);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private Double toPercent(double score) {
        return Math.round(score * 10000.0) / 100.0;
    }

    private Comparator<CandidateSemanticMatchResponse> matchScoreComparator() {
        return Comparator.comparing(
                CandidateSemanticMatchResponse::getDiemPhuHop,
                Comparator.nullsLast(Comparator.reverseOrder())
        );
    }

    private Comparator<JobSemanticMatchResponse> jobScoreComparator() {
        return Comparator.comparing(
                JobSemanticMatchResponse::getDiemPhuHop,
                Comparator.nullsLast(Comparator.reverseOrder())
        );
    }

    private Long toLong(Integer value) {
        return value == null ? null : value.longValue();
    }

    private String joinName(String ho, String ten) {
        String fullName = ((ho == null ? "" : ho) + " " + (ten == null ? "" : ten)).trim();
        return fullName.isBlank() ? null : fullName;
    }

}

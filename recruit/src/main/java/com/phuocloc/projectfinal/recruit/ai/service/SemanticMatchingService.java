package com.phuocloc.projectfinal.recruit.ai.service;

import com.phuocloc.projectfinal.recruit.ai.dto.response.CandidateSemanticMatchResponse;
import com.phuocloc.projectfinal.recruit.ai.dto.response.JobSemanticMatchResponse;
import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.candidate.repository.CandidateProfileRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.KyNangUngVienRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.NganhNgheUngVienRepository;
import com.phuocloc.projectfinal.recruit.company.service.CompanyAdminAccessService;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.KyNangTinTuyenDungRepository;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.TinTuyenDungRepository;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoUngVien;
import com.phuocloc.projectfinal.recruit.infrastructure.qdrant.QdrantClientService;
import com.phuocloc.projectfinal.recruit.infrastructure.qdrant.QdrantProperties;
import com.phuocloc.projectfinal.recruit.infrastructure.qdrant.QdrantSearchResult;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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

    private static final List<String> COMPANY_ADMIN_ROLES = List.of("OWNER", "MASTER_BRANCH", "HR");
    private static final int DEFAULT_LIMIT = 10;
    private static final int MAX_LIMIT = 50;

    private final TinTuyenDungRepository tinTuyenDungRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final KyNangUngVienRepository kyNangUngVienRepository;
    private final NganhNgheUngVienRepository nganhNgheUngVienRepository;
    private final KyNangTinTuyenDungRepository kyNangTinTuyenDungRepository;
    private final CompanyAdminAccessService accessService;
    private final JobEmbeddingIndexService jobEmbeddingIndexService;
    private final CandidateProfileEmbeddingIndexService candidateProfileEmbeddingIndexService;
    private final QdrantClientService qdrantClientService;
    private final QdrantProperties qdrantProperties;

    @Transactional
    public List<CandidateSemanticMatchResponse> timUngVienPhuHopChoTin(
            AppUserPrinciple principal,
            Long jobId,
            Integer limit
    ) {
        requireQdrantEnabled();
        Integer normalizedJobId = toIntId(jobId, "jobId");
        TinTuyenDung job = tinTuyenDungRepository.findById(normalizedJobId)
                .filter(item -> item.getNgayXoa() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tin tuyển dụng"));

        Integer branchId = job.getChiNhanh() == null ? null : job.getChiNhanh().getId();
        accessService.requireMembership(requireUserId(principal), branchId, COMPANY_ADMIN_ROLES);

        List<Float> queryVector = jobEmbeddingIndexService.layHoacTaoVectorChiMucChoMatching(job);
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
                .map(entry -> mapCandidateMatch(profiles.get(entry.getKey()), entry.getValue()))
                .filter(Objects::nonNull)
                .limit(normalizeLimit(limit))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<JobSemanticMatchResponse> timTinPhuHopChoHoSo(Long userId, Long profileId, Integer limit) {
        requireQdrantEnabled();
        Integer normalizedProfileId = toIntId(profileId, "profileId");
        HoSoUngVien profile = candidateProfileRepository
                .findByIdAndNguoiDung_Id(normalizedProfileId, toIntId(userId, "userId"))
                .filter(item -> item.getNgayXoa() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ ứng viên"));

        List<Float> queryVector = candidateProfileEmbeddingIndexService.taoVectorTruyVan(profile);
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

        return resultByJobId.entrySet().stream()
                .map(entry -> mapJobMatch(jobs.get(entry.getKey()), entry.getValue()))
                .filter(Objects::nonNull)
                .limit(normalizeLimit(limit))
                .toList();
    }

    private CandidateSemanticMatchResponse mapCandidateMatch(HoSoUngVien profile, QdrantSearchResult result) {
        if (profile == null || profile.getNguoiDung() == null || !Boolean.TRUE.equals(profile.getNguoiDung().getDangHoatDong())) {
            return null;
        }
        var user = profile.getNguoiDung();
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
                .diemPhuHop(toPercent(result.score()))
                .tinHieuKhop(candidateSignals(profile.getId()))
                .canKiemTraThem(candidateGaps(profile))
                .build();
    }

    private JobSemanticMatchResponse mapJobMatch(TinTuyenDung job, QdrantSearchResult result) {
        if (job == null) {
            return null;
        }
        var branch = job.getChiNhanh();
        var company = branch == null ? null : branch.getCongTy();
        return JobSemanticMatchResponse.builder()
                .tinTuyenDungId(toLong(job.getId()))
                .tieuDe(job.getTieuDe())
                .trangThai(job.getTrangThai())
                .congTyTen(company == null ? null : company.getTen())
                .congTyLogoUrl(company == null ? null : company.getLogoUrl())
                .chiNhanhTen(branch == null ? null : branch.getTen())
                .diaDiem(resolveLocation(job))
                .nganhNghe(job.getNganhNghe() == null ? null : job.getNganhNghe().getTen())
                .loaiHinhLamViec(job.getLoaiHinhLamViec() == null ? null : job.getLoaiHinhLamViec().getTen())
                .capDoKinhNghiem(job.getCapDoKinhNghiem() == null ? null : job.getCapDoKinhNghiem().getTen())
                .denHanLuc(job.getDenHanLuc())
                .diemPhuHop(toPercent(result.score()))
                .tinHieuKhop(jobSignals(job.getId()))
                .canKiemTraThem(jobGaps(job))
                .build();
    }

    private List<String> candidateSignals(Integer profileId) {
        if (profileId == null) {
            return List.of();
        }
        List<String> skills = kyNangUngVienRepository.findByHoSoUngVien_Id(profileId).stream()
                .filter(item -> item.getKyNang() != null && item.getKyNang().getTen() != null)
                .map(item -> item.getKyNang().getTen())
                .limit(6)
                .toList();
        if (!skills.isEmpty()) {
            return skills;
        }
        return nganhNgheUngVienRepository.findByHoSoUngVien_Id(profileId).stream()
                .filter(item -> item.getNganhNghe() != null && item.getNganhNghe().getTen() != null)
                .map(item -> item.getNganhNghe().getTen())
                .limit(6)
                .toList();
    }

    private List<String> jobSignals(Integer jobId) {
        if (jobId == null) {
            return List.of();
        }
        return kyNangTinTuyenDungRepository.findByTinTuyenDungIdOrderByKyNangTenAsc(jobId).stream()
                .filter(item -> item.getKyNang() != null && item.getKyNang().getTen() != null)
                .map(item -> item.getKyNang().getTen())
                .limit(6)
                .toList();
    }

    private List<String> candidateGaps(HoSoUngVien profile) {
        if (profile == null) {
            return List.of("Không tìm thấy hồ sơ");
        }
        if (candidateSignals(profile.getId()).isEmpty()) {
            return List.of("Hồ sơ chưa khai báo kỹ năng/ngành nghề");
        }
        return List.of("Cần HR xem chi tiết hồ sơ và CV trước khi liên hệ");
    }

    private List<String> jobGaps(TinTuyenDung job) {
        if (job == null) {
            return List.of("Không tìm thấy tin tuyển dụng");
        }
        if (jobSignals(job.getId()).isEmpty()) {
            return List.of("Tin chưa khai báo kỹ năng yêu cầu");
        }
        return List.of("Cần ứng viên đọc kỹ yêu cầu và hạn nộp trước khi ứng tuyển");
    }

    private String resolveLocation(TinTuyenDung job) {
        if (job.getChiNhanh() == null) {
            return null;
        }
        var branch = job.getChiNhanh();
        if (branch.getXaPhuong() != null && branch.getXaPhuong().getTinhThanh() != null) {
            return branch.getXaPhuong().getTen() + ", " + branch.getXaPhuong().getTinhThanh().getTen();
        }
        return branch.getDiaChiChiTiet();
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

    private Long toLong(Integer value) {
        return value == null ? null : value.longValue();
    }

    private String joinName(String ho, String ten) {
        String fullName = ((ho == null ? "" : ho) + " " + (ten == null ? "" : ten)).trim();
        return fullName.isBlank() ? null : fullName;
    }
}

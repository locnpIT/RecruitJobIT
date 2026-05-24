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
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
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

    private static final List<String> COMPANY_ADMIN_ROLES = List.of("OWNER", "MASTER_BRANCH", "HR");
    private static final int DEFAULT_LIMIT = 10;
    private static final int MAX_LIMIT = 50;

    private final TinTuyenDungRepository tinTuyenDungRepository;
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
                .map(entry -> mapCandidateMatch(job, profiles.get(entry.getKey()), entry.getValue()))
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

    private CandidateSemanticMatchResponse mapCandidateMatch(TinTuyenDung job, HoSoUngVien profile, QdrantSearchResult result) {
        if (profile == null || profile.getNguoiDung() == null || !Boolean.TRUE.equals(profile.getNguoiDung().getDangHoatDong())) {
            return null;
        }
        var user = profile.getNguoiDung();
        double diemPhuHop = toPercent(result.score());
        CandidateMatchExplanation explanation = buildCandidateExplanation(job, profile, diemPhuHop);
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
                .diemPhuHop(diemPhuHop)
                .lyDoPhuHop(explanation.lyDoPhuHop())
                .tinHieuKhop(explanation.tinHieuKhop())
                .diemManh(explanation.diemManh())
                .kinhNghiemLienQuan(explanation.kinhNghiemLienQuan())
                .canKiemTraThem(explanation.canKiemTraThem())
                .goiYHanhDong(explanation.goiYHanhDong())
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

    private CandidateMatchExplanation buildCandidateExplanation(TinTuyenDung job, HoSoUngVien profile, double diemPhuHop) {
        Integer profileId = profile.getId();
        Integer jobId = job == null ? null : job.getId();
        List<String> candidateSkills = candidateSkillNames(profileId);
        List<String> candidateIndustries = candidateIndustryNames(profileId);
        List<String> requiredSkills = jobSignals(jobId);
        List<String> matchedSkills = matchedNames(requiredSkills, candidateSkills);
        List<String> missingSkills = missingNames(requiredSkills, matchedSkills);
        boolean hasSummary = hasText(profile.getGioiThieuBanThan()) || hasText(profile.getMucTieuNgheNghiep());
        List<KinhNghiemLamViecUngVien> experiences = profileExperiences(profileId);
        boolean hasExperience = !experiences.isEmpty();
        boolean hasEducation = profileId != null && !hoSoHocVanRepository.findByHoSoUngVien_Id(profileId).isEmpty();
        boolean hasCertificate = profileId != null && !hoSoChungChiRepository.findByHoSoUngVien_Id(profileId).isEmpty();
        List<String> relevantExperiences = relevantExperienceInsights(job, experiences, requiredSkills);

        List<String> signals = new ArrayList<>();
        if (!matchedSkills.isEmpty()) {
            signals.add("Khớp kỹ năng yêu cầu: " + joinLimited(matchedSkills, 5));
        }
        if (matchedSkills.isEmpty() && !candidateSkills.isEmpty()) {
            signals.add("Kỹ năng đã khai báo: " + joinLimited(candidateSkills, 5));
        }
        if (!candidateIndustries.isEmpty()) {
            signals.add("Ngành nghề quan tâm: " + joinLimited(candidateIndustries, 3));
        }
        if (diemPhuHop >= 70) {
            signals.add("Nội dung hồ sơ có độ tương đồng semantic cao với tin tuyển dụng");
        }
        if (signals.isEmpty()) {
            signals.add("Qdrant vẫn tìm thấy liên quan ngữ nghĩa, nhưng hồ sơ thiếu dữ liệu có cấu trúc để giải thích sâu hơn");
        }

        List<String> strengths = new ArrayList<>();
        if (diemPhuHop >= 80) {
            strengths.add("Điểm tương đồng vector cao, hồ sơ có ngữ cảnh gần với mô tả/yêu cầu của tin");
        } else if (diemPhuHop >= 60) {
            strengths.add("Điểm tương đồng vector ở mức có thể xem xét");
        }
        if (!matchedSkills.isEmpty()) {
            strengths.add("Có kỹ năng trùng trực tiếp với yêu cầu: " + joinLimited(matchedSkills, 4));
        }
        if (hasExperience) {
            strengths.add("Có kinh nghiệm làm việc đã khai báo trong hồ sơ");
        }
        if (!relevantExperiences.isEmpty()) {
            strengths.add("Có kinh nghiệm liên quan trực tiếp để HR đối chiếu chi tiết");
        }
        if (hasEducation) {
            strengths.add("Có thông tin học vấn để HR đối chiếu nền tảng chuyên môn");
        }
        if (hasCertificate) {
            strengths.add("Có chứng chỉ/minh chứng nghề nghiệp trong hồ sơ");
        }
        if (strengths.isEmpty()) {
            strengths.add("Hồ sơ có thể phù hợp theo ngữ nghĩa tổng thể, nhưng chưa có nhiều dữ liệu cấu trúc nổi bật");
        }

        List<String> gaps = new ArrayList<>();
        if (requiredSkills.isEmpty()) {
            gaps.add("Tin tuyển dụng chưa khai báo kỹ năng yêu cầu để đối chiếu trực tiếp");
        } else if (!missingSkills.isEmpty()) {
            gaps.add("Chưa thấy các kỹ năng yêu cầu trong hồ sơ: " + joinLimited(missingSkills, 4));
        }
        if (candidateSkills.isEmpty()) {
            gaps.add("Hồ sơ chưa khai báo kỹ năng");
        }
        if (!hasExperience) {
            gaps.add("Hồ sơ chưa có kinh nghiệm làm việc để kiểm tra seniority");
        }
        if (!hasSummary) {
            gaps.add("Hồ sơ thiếu giới thiệu bản thân hoặc mục tiêu nghề nghiệp");
        }
        if (gaps.isEmpty()) {
            gaps.add("Cần HR xem chi tiết hồ sơ và CV trước khi liên hệ");
        }

        String jobTitle = hasText(job == null ? null : job.getTieuDe()) ? job.getTieuDe() : "tin tuyển dụng này";
        String reason = buildCandidateReason(jobTitle, diemPhuHop, matchedSkills, candidateSkills, hasExperience, relevantExperiences);
        String action = buildActionSuggestion(diemPhuHop, matchedSkills, missingSkills, hasExperience);
        return new CandidateMatchExplanation(reason, signals, strengths, relevantExperiences, gaps, action);
    }

    private String buildCandidateReason(
            String jobTitle,
            double diemPhuHop,
            List<String> matchedSkills,
            List<String> candidateSkills,
            boolean hasExperience,
            List<String> relevantExperiences
    ) {
        String base = "Qdrant đánh giá hồ sơ đạt " + diemPhuHop + "% tương thích với \"" + jobTitle + "\"";
        if (!matchedSkills.isEmpty()) {
            String reason = base + " vì có các kỹ năng trùng trực tiếp như " + joinLimited(matchedSkills, 4) + ".";
            if (!relevantExperiences.isEmpty()) {
                reason += " Kinh nghiệm nổi bật: " + relevantExperiences.getFirst();
            }
            return reason;
        }
        if (!candidateSkills.isEmpty() && hasExperience) {
            String reason = base + " nhờ ngữ cảnh kỹ năng và kinh nghiệm trong hồ sơ gần với nội dung tin.";
            if (!relevantExperiences.isEmpty()) {
                reason += " Kinh nghiệm nổi bật: " + relevantExperiences.getFirst();
            }
            return reason;
        }
        if (!candidateSkills.isEmpty()) {
            String reason = base + " nhờ nhóm kỹ năng đã khai báo có liên quan về mặt ngữ nghĩa.";
            if (!relevantExperiences.isEmpty()) {
                reason += " Kinh nghiệm nổi bật: " + relevantExperiences.getFirst();
            }
            return reason;
        }
        String reason = base + ", tuy nhiên hồ sơ còn ít dữ liệu cấu trúc nên HR cần kiểm tra kỹ trước khi liên hệ.";
        if (!relevantExperiences.isEmpty()) {
            reason += " Kinh nghiệm nổi bật: " + relevantExperiences.getFirst();
        }
        return reason;
    }

    private String buildActionSuggestion(
            double diemPhuHop,
            List<String> matchedSkills,
            List<String> missingSkills,
            boolean hasExperience
    ) {
        if (diemPhuHop >= 80 && (!matchedSkills.isEmpty() || hasExperience)) {
            return "Nên ưu tiên mở hồ sơ, kiểm tra CV và liên hệ nếu kinh nghiệm thực tế phù hợp.";
        }
        if (diemPhuHop >= 60) {
            return missingSkills.isEmpty()
                    ? "Nên đưa vào danh sách xem xét và kiểm tra thêm kinh nghiệm, dự án, mức lương kỳ vọng."
                    : "Có thể xem xét, nhưng cần hỏi thêm về các kỹ năng còn thiếu trước khi liên hệ sâu.";
        }
        return "Chỉ nên dùng như gợi ý tham khảo; HR cần kiểm tra kỹ vì tín hiệu phù hợp còn yếu.";
    }

    private List<KinhNghiemLamViecUngVien> profileExperiences(Integer profileId) {
        if (profileId == null) {
            return List.of();
        }
        return hoSoKinhNghiemRepository.findByHoSoUngVien_IdOrderByKinhNghiem_ThoiGianBatDauDesc(profileId).stream()
                .map(link -> link.getKinhNghiem())
                .filter(Objects::nonNull)
                .toList();
    }

    private List<String> relevantExperienceInsights(
            TinTuyenDung job,
            List<KinhNghiemLamViecUngVien> experiences,
            List<String> requiredSkills
    ) {
        if (experiences.isEmpty()) {
            return List.of();
        }
        KeywordProfile jobProfile = buildJobKeywordProfile(job, requiredSkills);
        return experiences.stream()
                .map(experience -> toExperienceInsight(experience, jobProfile))
                .sorted(Comparator.comparingInt(ExperienceInsight::score).reversed())
                .limit(3)
                .map(ExperienceInsight::message)
                .toList();
    }

    private ExperienceInsight toExperienceInsight(KinhNghiemLamViecUngVien experience, KeywordProfile jobProfile) {
        String title = hasText(experience.getChucDanh()) ? experience.getChucDanh().trim() : "Kinh nghiệm làm việc";
        String company = hasText(experience.getTenCongTy()) ? experience.getTenCongTy().trim() : "chưa rõ công ty";
        KeywordProfile experienceProfile = buildExperienceKeywordProfile(experience);
        List<KeywordHit> matchedKeywords = matchedKeywordHits(jobProfile, experienceProfile);
        String duration = formatExperienceDuration(experience.getThoiGianBatDau(), experience.getThoiGianKetThuc());
        int score = matchedKeywords.stream().mapToInt(KeywordHit::score).sum()
                + (hasText(experience.getMoTaCongViec()) ? 2 : 0);

        StringBuilder message = new StringBuilder();
        message.append(title).append(" tại ").append(company);
        if (hasText(duration)) {
            message.append(" (").append(duration).append(")");
        }
        if (!matchedKeywords.isEmpty()) {
            message.append(" liên quan đến: ").append(joinLimitedHitLabels(matchedKeywords, 4)).append(".");
        } else if (hasText(experience.getMoTaCongViec())) {
            message.append(" có mô tả công việc để HR đọc sâu, nhưng chưa thấy cụm từ khớp rõ với bộ từ điển nội bộ.");
        } else {
            message.append(" chưa có mô tả đủ chi tiết để đánh giá mức độ liên quan.");
        }
        return new ExperienceInsight(score, message.toString());
    }

    private KeywordProfile buildJobKeywordProfile(TinTuyenDung job, List<String> requiredSkills) {
        List<KeywordHit> hits = new ArrayList<>();
        addKeywordHits(hits, "job-title", job == null ? null : job.getTieuDe(), 4);
        addKeywordHits(hits, "job-requirement", job == null ? null : job.getYeuCau(), 3);
        addKeywordHits(hits, "job-description", job == null ? null : job.getMoTa(), 2);
        addKeywordHits(hits, "job-industry", job == null || job.getNganhNghe() == null ? null : job.getNganhNghe().getTen(), 2);
        addKeywordHits(hits, "job-skills", requiredSkills == null ? null : String.join(" ", requiredSkills), 5);
        return dedupeKeywordProfile(hits);
    }

    private KeywordProfile buildExperienceKeywordProfile(KinhNghiemLamViecUngVien experience) {
        List<KeywordHit> hits = new ArrayList<>();
        addKeywordHits(hits, "experience-title", experience == null ? null : experience.getChucDanh(), 4);
        addKeywordHits(hits, "experience-company", experience == null ? null : experience.getTenCongTy(), 1);
        addKeywordHits(hits, "experience-description", experience == null ? null : experience.getMoTaCongViec(), 3);
        return dedupeKeywordProfile(hits);
    }

    private void addKeywordHits(List<KeywordHit> hits, String source, String text, int sourceWeight) {
        String normalized = normalizeText(text);
        if (normalized.isBlank()) {
            return;
        }
        for (KeywordFamily family : EXPERIENCE_KEYWORD_FAMILIES) {
            List<String> matchedAliases = family.aliases().stream()
                    .filter(alias -> containsNormalizedPhrase(normalized, alias))
                    .distinct()
                    .toList();
            if (!matchedAliases.isEmpty()) {
                int weight = family.baseWeight() + sourceWeight + Math.min(matchedAliases.size() * 2, 6);
                hits.add(new KeywordHit(family.canonical(), family.label(), weight, source, matchedAliases));
            }
        }
    }

    private KeywordProfile dedupeKeywordProfile(List<KeywordHit> hits) {
        Map<String, KeywordHit> dedup = new LinkedHashMap<>();
        for (KeywordHit hit : hits) {
            KeywordHit existing = dedup.get(hit.canonical());
            if (existing == null || hit.score() > existing.score()) {
                dedup.put(hit.canonical(), hit);
            }
        }
        return new KeywordProfile(new ArrayList<>(dedup.values()));
    }

    private List<KeywordHit> matchedKeywordHits(KeywordProfile jobProfile, KeywordProfile experienceProfile) {
        if (jobProfile.hits().isEmpty() || experienceProfile.hits().isEmpty()) {
            return List.of();
        }
        Map<String, KeywordHit> jobByCanonical = jobProfile.hits().stream()
                .collect(java.util.stream.Collectors.toMap(KeywordHit::canonical, hit -> hit, (a, b) -> a, LinkedHashMap::new));
        return experienceProfile.hits().stream()
                .map(expHit -> {
                    KeywordHit jobHit = jobByCanonical.get(expHit.canonical());
                    if (jobHit == null) {
                        return null;
                    }
                    int overlapScore = Math.max(jobHit.score(), expHit.score());
                    List<String> mergedAliases = mergeAliases(jobHit.matchedAliases(), expHit.matchedAliases());
                    return new KeywordHit(expHit.canonical(), expHit.label(), overlapScore, expHit.source() + "+" + jobHit.source(), mergedAliases);
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(KeywordHit::score).reversed())
                .limit(6)
                .toList();
    }

    private List<String> mergeAliases(List<String> left, List<String> right) {
        LinkedHashSet<String> merged = new LinkedHashSet<>();
        if (left != null) {
            merged.addAll(left);
        }
        if (right != null) {
            merged.addAll(right);
        }
        return new ArrayList<>(merged);
    }

    private boolean containsNormalizedPhrase(String normalizedText, String alias) {
        String normalizedAlias = normalizeText(alias);
        if (normalizedText.isBlank() || normalizedAlias.isBlank()) {
            return false;
        }
        return (" " + normalizedText + " ").contains(" " + normalizedAlias + " ");
    }

    private String normalizeText(String value) {
        if (!hasText(value)) {
            return "";
        }
        String normalized = java.text.Normalizer.normalize(value, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT);
        normalized = normalized
                .replace("c#", "c sharp")
                .replace("asp.net", "asp net")
                .replace("next.js", "next js")
                .replace("node.js", "node js")
                .replace("ci/cd", "ci cd")
                .replace("front-end", "front end")
                .replace("back-end", "back end")
                .replace("&", " and ");
        normalized = normalized.replaceAll("[^a-z0-9]+", " ").trim();
        return normalized.replaceAll("\\s+", " ");
    }

    private List<String> joinLimitedHitLabels(List<KeywordHit> hits, int limit) {
        return hits.stream()
                .limit(limit)
                .map(hit -> hit.label())
                .toList();
    }

    private String formatExperienceDuration(LocalDate from, LocalDate to) {
        if (from == null) {
            return "";
        }
        LocalDate end = to == null ? LocalDate.now() : to;
        if (end.isBefore(from)) {
            return "";
        }
        long months = Math.max(1, ChronoUnit.MONTHS.between(from.withDayOfMonth(1), end.withDayOfMonth(1)));
        long years = months / 12;
        long remainingMonths = months % 12;
        if (years > 0 && remainingMonths > 0) {
            return years + " năm " + remainingMonths + " tháng";
        }
        if (years > 0) {
            return years + " năm";
        }
        return months + " tháng";
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

    private List<String> candidateSkillNames(Integer profileId) {
        if (profileId == null) {
            return List.of();
        }
        return kyNangUngVienRepository.findByHoSoUngVien_Id(profileId).stream()
                .filter(item -> item.getKyNang() != null && hasText(item.getKyNang().getTen()))
                .map(item -> item.getKyNang().getTen().trim())
                .distinct()
                .toList();
    }

    private List<String> candidateIndustryNames(Integer profileId) {
        if (profileId == null) {
            return List.of();
        }
        return nganhNgheUngVienRepository.findByHoSoUngVien_Id(profileId).stream()
                .filter(item -> item.getNganhNghe() != null && hasText(item.getNganhNghe().getTen()))
                .map(item -> item.getNganhNghe().getTen().trim())
                .distinct()
                .toList();
    }

    private List<String> matchedNames(List<String> required, List<String> candidate) {
        if (required.isEmpty() || candidate.isEmpty()) {
            return List.of();
        }
        Set<String> candidateKeys = candidate.stream()
                .map(this::normalizeName)
                .collect(java.util.stream.Collectors.toSet());
        return required.stream()
                .filter(item -> candidateKeys.contains(normalizeName(item)))
                .distinct()
                .toList();
    }

    private List<String> missingNames(List<String> required, List<String> matched) {
        if (required.isEmpty()) {
            return List.of();
        }
        Set<String> matchedKeys = matched.stream()
                .map(this::normalizeName)
                .collect(java.util.stream.Collectors.toSet());
        return required.stream()
                .filter(item -> !matchedKeys.contains(normalizeName(item)))
                .distinct()
                .toList();
    }

    private String joinLimited(List<String> values, int limit) {
        return values.stream()
                .filter(this::hasText)
                .limit(limit)
                .collect(java.util.stream.Collectors.joining(", "));
    }

    private String normalizeName(String value) {
        return normalizeText(value);
    }

    private String nullToBlank(String value) {
        return value == null ? "" : value;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private static final List<KeywordFamily> EXPERIENCE_KEYWORD_FAMILIES = List.of(
            family("backend", "Backend/API", 14, "backend", "back end", "server side", "server-side", "api", "rest api", "restful api", "web service", "microservice", "microservices"),
            family("java", "Java/Spring", 13, "java", "spring", "spring boot", "springboot", "hibernate", "jpa", "j2ee"),
            family("dotnet", ".NET/C#", 13, "dotnet", "dot net", "asp net", "asp net core", "c sharp", "csharp", ".net"),
            family("database", "Database/SQL", 12, "database", "sql", "sql server", "mysql", "mssql", "postgresql", "postgres", "oracle", "mongodb", "redis"),
            family("cloud", "Cloud/DevOps", 10, "cloud", "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "github actions", "gitlab ci", "ci cd"),
            family("architecture", "Architecture/Microservices", 10, "architecture", "system design", "microservice", "microservices", "distributed", "scalable"),
            family("frontend", "Frontend/UI", 9, "frontend", "front end", "react", "next js", "nextjs", "javascript", "typescript", "ui", "ux"),
            family("security", "Security/Auth", 9, "jwt", "oauth", "authentication", "authorization", "spring security"),
            family("testing", "Testing/QA", 8, "testing", "test", "unit test", "integration test", "automation", "qa"),
            family("queue", "Queue/Jobs/Webhook", 8, "queue", "background service", "scheduled job", "webhook", "rabbitmq", "kafka"),
            family("data", "Data/Analytics", 8, "data", "etl", "report", "analytics", "bi", "dashboard")
    );

    private static KeywordFamily family(String canonical, String label, int baseWeight, String... aliases) {
        List<String> normalizedAliases = new ArrayList<>(aliases.length);
        for (String alias : aliases) {
            normalizedAliases.add(alias);
        }
        return new KeywordFamily(canonical, label, baseWeight, normalizedAliases);
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

    private record CandidateMatchExplanation(
            String lyDoPhuHop,
            List<String> tinHieuKhop,
            List<String> diemManh,
            List<String> kinhNghiemLienQuan,
            List<String> canKiemTraThem,
            String goiYHanhDong
    ) {
    }

    private record ExperienceInsight(int score, String message) {
    }

    private record KeywordFamily(String canonical, String label, int baseWeight, List<String> aliases) {
    }

    private record KeywordHit(String canonical, String label, int score, String source, List<String> matchedAliases) {
    }

    private record KeywordProfile(List<KeywordHit> hits) {
    }
}

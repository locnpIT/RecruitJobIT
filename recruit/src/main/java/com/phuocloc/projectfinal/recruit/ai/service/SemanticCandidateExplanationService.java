package com.phuocloc.projectfinal.recruit.ai.service;

import com.phuocloc.projectfinal.recruit.candidate.repository.HoSoChungChiRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.HoSoHocVanRepository;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoUngVien;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.KinhNghiemLamViecUngVien;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SemanticCandidateExplanationService {

    private final HoSoHocVanRepository hoSoHocVanRepository;
    private final HoSoChungChiRepository hoSoChungChiRepository;
    private final SemanticMatchScoringService scoringService;
    private final SemanticMatchSignalService signalService;

    public CandidateMatchExplanation buildCandidateExplanation(TinTuyenDung job, HoSoUngVien profile, double semanticPercent) {
        Integer profileId = profile.getId();
        Integer jobId = job == null ? null : job.getId();
        List<String> candidateSkills = signalService.candidateSkillNames(profileId);
        List<String> candidateIndustries = signalService.candidateIndustryNames(profileId);
        List<String> requiredSkills = signalService.jobSignals(jobId);
        List<String> matchedSkills = signalService.matchedNames(requiredSkills, candidateSkills);
        List<String> missingSkills = signalService.missingNames(requiredSkills, matchedSkills);
        boolean hasSummary = signalService.hasText(profile.getGioiThieuBanThan()) || signalService.hasText(profile.getMucTieuNgheNghiep());
        List<KinhNghiemLamViecUngVien> experiences = signalService.profileExperiences(profileId);
        boolean hasExperience = !experiences.isEmpty();
        boolean hasEducation = profileId != null && !hoSoHocVanRepository.findByHoSoUngVien_Id(profileId).isEmpty();
        boolean hasCertificate = profileId != null && !hoSoChungChiRepository.findByHoSoUngVien_Id(profileId).isEmpty();
        List<String> relevantExperiences = relevantExperienceInsights(job, experiences, requiredSkills);
        double finalScore = scoringService.scoreCandidateForJob(
                semanticPercent,
                requiredSkills,
                matchedSkills,
                job == null || job.getNganhNghe() == null ? null : job.getNganhNghe().getTen(),
                candidateIndustries,
                hasExperience,
                !relevantExperiences.isEmpty(),
                hasSummary
        );
        String scoreNote = scoringService.describeScore(semanticPercent, finalScore);

        List<String> signals = buildSignals(candidateSkills, candidateIndustries, matchedSkills, semanticPercent, scoreNote);
        List<String> strengths = buildStrengths(finalScore, matchedSkills, hasExperience, hasEducation, hasCertificate, relevantExperiences);
        List<String> gaps = buildGaps(requiredSkills, missingSkills, candidateSkills, hasExperience, hasSummary);

        String jobTitle = signalService.hasText(job == null ? null : job.getTieuDe()) ? job.getTieuDe() : "tin tuyển dụng này";
        String reason = buildCandidateReason(jobTitle, finalScore, semanticPercent, matchedSkills, candidateSkills, hasExperience, relevantExperiences);
        String action = buildActionSuggestion(finalScore, matchedSkills, missingSkills, hasExperience);
        return new CandidateMatchExplanation(finalScore, reason, signals, strengths, relevantExperiences, gaps, action);
    }

    private List<String> buildSignals(
            List<String> candidateSkills,
            List<String> candidateIndustries,
            List<String> matchedSkills,
            double semanticPercent,
            String scoreNote
    ) {
        List<String> signals = new ArrayList<>();
        if (!matchedSkills.isEmpty()) {
            signals.add("Khớp kỹ năng yêu cầu: " + signalService.joinLimited(matchedSkills, 5));
        }
        if (matchedSkills.isEmpty() && !candidateSkills.isEmpty()) {
            signals.add("Kỹ năng đã khai báo: " + signalService.joinLimited(candidateSkills, 5));
        }
        if (!candidateIndustries.isEmpty()) {
            signals.add("Ngành nghề quan tâm: " + signalService.joinLimited(candidateIndustries, 3));
        }
        if (semanticPercent >= 70) {
            signals.add("Nội dung hồ sơ có độ tương đồng semantic cao với tin tuyển dụng");
        }
        signals.add(scoreNote);
        if (signals.isEmpty()) {
            signals.add("Qdrant vẫn tìm thấy liên quan ngữ nghĩa, nhưng hồ sơ thiếu dữ liệu có cấu trúc để giải thích sâu hơn");
        }
        return signals;
    }

    private List<String> buildStrengths(
            double finalScore,
            List<String> matchedSkills,
            boolean hasExperience,
            boolean hasEducation,
            boolean hasCertificate,
            List<String> relevantExperiences
    ) {
        List<String> strengths = new ArrayList<>();
        if (finalScore >= 80) {
            strengths.add("Điểm phù hợp tổng hợp cao sau khi kết hợp semantic, kỹ năng và kinh nghiệm");
        } else if (finalScore >= 60) {
            strengths.add("Điểm phù hợp tổng hợp ở mức có thể xem xét");
        }
        if (!matchedSkills.isEmpty()) {
            strengths.add("Có kỹ năng trùng trực tiếp với yêu cầu: " + signalService.joinLimited(matchedSkills, 4));
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
        return strengths;
    }

    private List<String> buildGaps(
            List<String> requiredSkills,
            List<String> missingSkills,
            List<String> candidateSkills,
            boolean hasExperience,
            boolean hasSummary
    ) {
        List<String> gaps = new ArrayList<>();
        if (requiredSkills.isEmpty()) {
            gaps.add("Tin tuyển dụng chưa khai báo kỹ năng yêu cầu để đối chiếu trực tiếp");
        } else if (!missingSkills.isEmpty()) {
            gaps.add("Chưa thấy các kỹ năng yêu cầu trong hồ sơ: " + signalService.joinLimited(missingSkills, 4));
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
        return gaps;
    }

    private String buildCandidateReason(
            String jobTitle,
            double diemPhuHop,
            double semanticPercent,
            List<String> matchedSkills,
            List<String> candidateSkills,
            boolean hasExperience,
            List<String> relevantExperiences
    ) {
        String base = "Hệ thống đánh giá hồ sơ đạt " + diemPhuHop + "% phù hợp với \"" + jobTitle
                + "\" sau khi kết hợp semantic score từ Qdrant (" + semanticPercent + "%) và tín hiệu hồ sơ";
        if (!matchedSkills.isEmpty()) {
            String reason = base + " vì có các kỹ năng trùng trực tiếp như " + signalService.joinLimited(matchedSkills, 4) + ".";
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
        String title = signalService.hasText(experience.getChucDanh()) ? experience.getChucDanh().trim() : "Kinh nghiệm làm việc";
        String company = signalService.hasText(experience.getTenCongTy()) ? experience.getTenCongTy().trim() : "chưa rõ công ty";
        KeywordProfile experienceProfile = buildExperienceKeywordProfile(experience);
        List<KeywordHit> matchedKeywords = matchedKeywordHits(jobProfile, experienceProfile);
        String duration = formatExperienceDuration(experience.getThoiGianBatDau(), experience.getThoiGianKetThuc());
        int score = matchedKeywords.stream().mapToInt(KeywordHit::score).sum()
                + (signalService.hasText(experience.getMoTaCongViec()) ? 2 : 0);

        StringBuilder message = new StringBuilder();
        message.append(title).append(" tại ").append(company);
        if (signalService.hasText(duration)) {
            message.append(" (").append(duration).append(")");
        }
        if (!matchedKeywords.isEmpty()) {
            message.append(" liên quan đến: ").append(joinLimitedHitLabels(matchedKeywords, 4)).append(".");
        } else if (signalService.hasText(experience.getMoTaCongViec())) {
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
        String normalized = signalService.normalizeText(text);
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
        String normalizedAlias = signalService.normalizeText(alias);
        if (normalizedText.isBlank() || normalizedAlias.isBlank()) {
            return false;
        }
        return (" " + normalizedText + " ").contains(" " + normalizedAlias + " ");
    }

    private List<String> joinLimitedHitLabels(List<KeywordHit> hits, int limit) {
        return hits.stream()
                .limit(limit)
                .map(KeywordHit::label)
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

    private record ExperienceInsight(int score, String message) {
    }

    private record KeywordFamily(String canonical, String label, int baseWeight, List<String> aliases) {
    }

    private record KeywordHit(String canonical, String label, int score, String source, List<String> matchedAliases) {
    }

    private record KeywordProfile(List<KeywordHit> hits) {
    }
}

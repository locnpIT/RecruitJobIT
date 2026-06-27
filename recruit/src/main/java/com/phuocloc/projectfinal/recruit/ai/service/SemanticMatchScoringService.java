package com.phuocloc.projectfinal.recruit.ai.service;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

/**
 * Tính điểm matching cuối cùng từ điểm vector và tín hiệu nghiệp vụ có cấu trúc.
 */
@Service
public class SemanticMatchScoringService {

    private static final double SEMANTIC_WEIGHT = 0.65;
    private static final double SKILL_WEIGHT = 0.20;
    private static final double INDUSTRY_WEIGHT = 0.05;
    private static final double EXPERIENCE_WEIGHT = 0.07;
    private static final double COMPLETENESS_WEIGHT = 0.03;
    private static final double HARD_MISMATCH_SCORE_CAP = 10.0;

    public double scoreCandidateForJob(
            double semanticPercent,
            List<String> requiredSkills,
            List<String> matchedSkills,
            String jobIndustry,
            List<String> candidateIndustries,
            boolean hasExperience,
            boolean hasRelevantExperience,
            boolean hasSummary
    ) {
        double skillScore = skillCoverage(requiredSkills, matchedSkills);
        double industryScore = matchesAny(jobIndustry, candidateIndustries) ? 100.0 : neutralIfEmpty(candidateIndustries);
        double experienceScore = hasRelevantExperience ? 100.0 : hasExperience ? 65.0 : 0.0;
        double completenessScore = hasSummary ? 100.0 : 35.0;

        double score = weightedScore(semanticPercent, skillScore, industryScore, experienceScore, completenessScore);
        return capHardMismatchScore(score, requiredSkills, matchedSkills, jobIndustry, candidateIndustries);
    }

    public double scoreJobForProfile(
            double semanticPercent,
            List<String> requiredSkills,
            List<String> matchedSkills,
            String jobIndustry,
            List<String> candidateIndustries,
            boolean hasProfileExperience,
            boolean hasProfileSummary
    ) {
        double skillScore = skillCoverage(requiredSkills, matchedSkills);
        double industryScore = matchesAny(jobIndustry, candidateIndustries) ? 100.0 : neutralIfEmpty(candidateIndustries);
        double experienceScore = hasProfileExperience ? 75.0 : 30.0;
        double completenessScore = hasProfileSummary ? 100.0 : 35.0;

        double score = weightedScore(semanticPercent, skillScore, industryScore, experienceScore, completenessScore);
        return capHardMismatchScore(score, requiredSkills, matchedSkills, jobIndustry, candidateIndustries);
    }

    public String describeScore(double semanticPercent, double finalScore) {
        if (finalScore >= semanticPercent + 5) {
            return "Điểm đã được nâng lên nhờ kỹ năng/ngành nghề/kinh nghiệm có cấu trúc khớp với yêu cầu.";
        }
        if (finalScore <= semanticPercent - 5) {
            return "Điểm đã được điều chỉnh xuống vì tín hiệu có cấu trúc còn thiếu hoặc chưa khớp rõ.";
        }
        return "Điểm gần với Qdrant semantic score và được xác nhận thêm bằng dữ liệu hồ sơ/tin tuyển dụng.";
    }

    private double weightedScore(
            double semanticPercent,
            double skillScore,
            double industryScore,
            double experienceScore,
            double completenessScore
    ) {
        double score = clamp(semanticPercent) * SEMANTIC_WEIGHT
                + clamp(skillScore) * SKILL_WEIGHT
                + clamp(industryScore) * INDUSTRY_WEIGHT
                + clamp(experienceScore) * EXPERIENCE_WEIGHT
                + clamp(completenessScore) * COMPLETENESS_WEIGHT;
        return Math.round(score * 100.0) / 100.0;
    }

    private double skillCoverage(List<String> requiredSkills, List<String> matchedSkills) {
        if (requiredSkills == null || requiredSkills.isEmpty()) {
            // Không có yêu cầu kỹ năng → điểm trung tính, không ưu tiên cũng không phạt.
            return 50.0;
        }
        if (matchedSkills == null || matchedSkills.isEmpty()) {
            return 0.0;
        }
        long requiredCount = requiredSkills.stream()
                .map(this::normalize)
                .filter(value -> !value.isBlank())
                .distinct()
                .count();
        long matchedCount = matchedSkills.stream()
                .map(this::normalize)
                .filter(value -> !value.isBlank())
                .distinct()
                .count();
        if (requiredCount == 0) {
            return 50.0;
        }
        return Math.min(100.0, (matchedCount * 100.0) / requiredCount);
    }

    private boolean matchesAny(String expected, List<String> values) {
        String expectedKey = normalize(expected);
        if (expectedKey.isBlank() || values == null || values.isEmpty()) {
            return false;
        }
        return values.stream()
                .map(this::normalize)
                .anyMatch(value -> value.equals(expectedKey) || value.contains(expectedKey) || expectedKey.contains(value));
    }

    private double neutralIfEmpty(List<String> values) {
        return values == null || values.isEmpty() ? 50.0 : 25.0;
    }

    private double capHardMismatchScore(
            double score,
            List<String> requiredSkills,
            List<String> matchedSkills,
            String jobIndustry,
            List<String> candidateIndustries
    ) {
        if (hasAnyNormalizedValue(requiredSkills)
                && !hasAnyNormalizedValue(matchedSkills)
                && !matchesAny(jobIndustry, candidateIndustries)) {
            return Math.min(score, HARD_MISMATCH_SCORE_CAP);
        }
        return score;
    }

    private boolean hasAnyNormalizedValue(List<String> values) {
        return values != null && values.stream()
                .map(this::normalize)
                .anyMatch(value -> !value.isBlank());
    }

    private double clamp(double score) {
        if (Double.isNaN(score) || Double.isInfinite(score)) {
            return 0.0;
        }
        return Math.max(0.0, Math.min(score, 100.0));
    }

    private String normalize(String value) {
        if (value == null || value.trim().isEmpty()) {
            return "";
        }
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT);
        return normalized.replaceAll("[^a-z0-9]+", " ").trim().replaceAll("\\s+", " ");
    }
}

package com.phuocloc.projectfinal.recruit.publicjob.service;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Pure text-analysis utilities for the job search fallback (JPA path).
 * No Spring dependencies — all methods are stateless and side-effect-free.
 */
@Component
public class JobSearchTextAnalyzer {

    public String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    public boolean contains(String source, String keyword) {
        return StringUtils.hasText(source) && source.contains(keyword);
    }

    public List<String> splitSearchTokens(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return List.of();
        }
        return Arrays.stream(normalize(keyword).split("\\s+"))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
    }

    public List<String> splitExcludedKeywords(String excludedKeywords) {
        if (!StringUtils.hasText(excludedKeywords)) {
            return List.of();
        }
        return Arrays.stream(excludedKeywords.split("[,;|\\n]+"))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
    }

    public String expandSearchAliases(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        String normalized = value;
        String lower = value.toLowerCase(Locale.ROOT);
        if (lower.contains("javascript") || lower.matches(".*\\bjs\\b.*")) {
            normalized += " JavaScript JS";
        }
        if (lower.contains("typescript") || lower.matches(".*\\bts\\b.*")) {
            normalized += " TypeScript TS";
        }
        if (lower.contains("react")) {
            normalized += " React ReactJS";
        }
        if (lower.contains("node")) {
            normalized += " Node Node.js NodeJS";
        }
        if (lower.contains("spring")) {
            normalized += " Spring Spring Boot";
        }
        if (lower.contains("cicd") || lower.contains("ci/cd") || lower.contains("ci cd")) {
            normalized += " CI/CD CICD CI CD";
        }
        if (lower.contains("remote") || lower.contains("từ xa") || lower.contains("tu xa") || lower.contains("work from home")) {
            normalized += " remote từ xa tu xa online work from home làm ở nhà";
        }
        if (lower.contains("fulltime") || lower.contains("full-time") || lower.contains("toàn thời gian")) {
            normalized += " fulltime full-time toàn thời gian";
        }
        if (lower.contains("parttime") || lower.contains("part-time") || lower.contains("bán thời gian")) {
            normalized += " parttime part-time bán thời gian";
        }
        if (lower.contains("intern") || lower.contains("thực tập") || lower.contains("thuc tap")) {
            normalized += " intern internship thực tập thuc tap";
        }
        return normalized;
    }
}

package com.phuocloc.projectfinal.recruit.ai.service;

import com.phuocloc.projectfinal.recruit.candidate.repository.HoSoKinhNghiemRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.KyNangUngVienRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.NganhNgheUngVienRepository;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.repository.KyNangTinTuyenDungRepository;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.KinhNghiemLamViecUngVien;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SemanticMatchSignalService {

    private final KyNangUngVienRepository kyNangUngVienRepository;
    private final NganhNgheUngVienRepository nganhNgheUngVienRepository;
    private final HoSoKinhNghiemRepository hoSoKinhNghiemRepository;
    private final KyNangTinTuyenDungRepository kyNangTinTuyenDungRepository;

    public List<KinhNghiemLamViecUngVien> profileExperiences(Integer profileId) {
        if (profileId == null) {
            return List.of();
        }
        return hoSoKinhNghiemRepository.findByHoSoUngVien_IdOrderByKinhNghiem_ThoiGianBatDauDesc(profileId).stream()
                .map(link -> link.getKinhNghiem())
                .filter(java.util.Objects::nonNull)
                .toList();
    }

    public List<String> candidateSkillNames(Integer profileId) {
        if (profileId == null) {
            return List.of();
        }
        return kyNangUngVienRepository.findByHoSoUngVien_Id(profileId).stream()
                .filter(item -> item.getKyNang() != null && hasText(item.getKyNang().getTen()))
                .map(item -> item.getKyNang().getTen().trim())
                .distinct()
                .toList();
    }

    public List<String> candidateIndustryNames(Integer profileId) {
        if (profileId == null) {
            return List.of();
        }
        return nganhNgheUngVienRepository.findByHoSoUngVien_Id(profileId).stream()
                .filter(item -> item.getNganhNghe() != null && hasText(item.getNganhNghe().getTen()))
                .map(item -> item.getNganhNghe().getTen().trim())
                .distinct()
                .toList();
    }

    public List<String> jobSignals(Integer jobId) {
        if (jobId == null) {
            return List.of();
        }
        return kyNangTinTuyenDungRepository.findByTinTuyenDungIdOrderByKyNangTenAsc(jobId).stream()
                .filter(item -> item.getKyNang() != null && item.getKyNang().getTen() != null)
                .map(item -> item.getKyNang().getTen())
                .limit(6)
                .toList();
    }

    public List<String> matchedNames(List<String> required, List<String> candidate) {
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

    public List<String> missingNames(List<String> required, List<String> matched) {
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

    public List<String> jobGaps(TinTuyenDung job) {
        if (job == null) {
            return List.of("Không tìm thấy tin tuyển dụng");
        }
        if (jobSignals(job.getId()).isEmpty()) {
            return List.of("Tin chưa khai báo kỹ năng yêu cầu");
        }
        return List.of("Cần ứng viên đọc kỹ yêu cầu và hạn nộp trước khi ứng tuyển");
    }

    public String joinLimited(List<String> values, int limit) {
        return values.stream()
                .filter(this::hasText)
                .limit(limit)
                .collect(java.util.stream.Collectors.joining(", "));
    }

    public String normalizeText(String value) {
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

    public boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private String normalizeName(String value) {
        return normalizeText(value);
    }
}

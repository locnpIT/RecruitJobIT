package com.phuocloc.projectfinal.recruit.ai.service;

import com.phuocloc.projectfinal.recruit.candidate.repository.HoSoChungChiRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.HoSoHocVanRepository;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoUngVien;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.KinhNghiemLamViecUngVien;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SemanticCandidateExplanationService {

    private final HoSoHocVanRepository hoSoHocVanRepository;
    private final HoSoChungChiRepository hoSoChungChiRepository;
    private final SemanticMatchScoringService scoringService;
    private final SemanticMatchSignalService signalService;
    private final KinhNghiemEmbeddingIndexService kinhNghiemEmbeddingIndexService;

    /**
     * Xây dựng giải thích matching cho ứng viên. Nhận thêm {@code jobVector} (đã tính trước ở
     * {@link SemanticMatchingService}) để tái sử dụng cho Qdrant search kinh nghiệm liên quan
     * — tránh gọi Python embedding lần thứ hai.
     *
     * @param jobVector Vector của tin tuyển dụng, có thể null nếu Qdrant tắt
     */
    public CandidateMatchExplanation buildCandidateExplanation(
            TinTuyenDung job, HoSoUngVien profile, double semanticPercent, List<Float> jobVector) {
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

        // Dùng Qdrant vector search để tìm kinh nghiệm liên quan — không dùng từ điển IT hardcode,
        // hoạt động đúng với mọi ngành nghề.
        Integer nguoiDungId = profile.getNguoiDung() == null ? null : profile.getNguoiDung().getId();
        Map<Integer, KinhNghiemLamViecUngVien> experienceById = experiences.stream()
                .filter(e -> e.getId() != null)
                .collect(Collectors.toMap(KinhNghiemLamViecUngVien::getId, e -> e, (a, b) -> a));
        List<String> relevantExperiences =
                kinhNghiemEmbeddingIndexService.findRelevantExperiences(jobVector, nguoiDungId, experienceById);
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
            signals.add("Khớp kỹ năng yêu cầu: " + signalService.joinAll(matchedSkills));
        }
        if (matchedSkills.isEmpty() && !candidateSkills.isEmpty()) {
            signals.add("Kỹ năng đã khai báo: " + signalService.joinAll(candidateSkills));
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
            strengths.add("Có kỹ năng trùng trực tiếp với yêu cầu: " + signalService.joinAll(matchedSkills));
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
            gaps.add("Chưa thấy các kỹ năng yêu cầu trong hồ sơ: " + signalService.joinAll(missingSkills));
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
            String reason = base + " vì có các kỹ năng trùng trực tiếp như " + signalService.joinAll(matchedSkills) + ".";
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

}

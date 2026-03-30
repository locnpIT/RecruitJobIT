package com.phuocloc.projectfinal.recruit.ai.entity;

import com.phuocloc.projectfinal.recruit.candidate.entity.CandidateProfile;
import com.phuocloc.projectfinal.recruit.candidate.entity.CandidateResume;
import com.phuocloc.projectfinal.recruit.job.entity.Job;
import com.phuocloc.projectfinal.recruit.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Objects;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "phanTichThieuKyNang",
        indexes = {
                @Index(name = "idx_skill_gap_job", columnList = "tinTuyenDungId"),
                @Index(name = "idx_skill_gap_job_candidate", columnList = "tinTuyenDungId,ungVienId"),
                @Index(name = "idx_skill_gap_job_missing", columnList = "tinTuyenDungId,soKyNangThieu"),
                @Index(name = "idx_skill_gap_job_coverage", columnList = "tinTuyenDungId,diemBaoPhu"),
                @Index(name = "idx_skill_gap_analyzed_at", columnList = "phanTichLuc")
        }
)
public class SkillGapAnalysis extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tinTuyenDungId", nullable = false)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hoSoCvId", nullable = false)
    private CandidateResume resume;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ungVienId", nullable = false)
    private CandidateProfile candidate;

    @Column(name = "kyNangPhuHopJson", columnDefinition = "TEXT")
    private String matchedSkillsJson;

    @Column(name = "kyNangThieuJson", columnDefinition = "TEXT")
    private String missingSkillsJson;

    @Column(name = "kyNangThemJson", columnDefinition = "TEXT")
    private String extraSkillsJson;

    @Column(name = "soKyNangPhuHop", nullable = false)
    @Builder.Default
    private Integer matchedCount = 0;

    @Column(name = "soKyNangThieu", nullable = false)
    @Builder.Default
    private Integer missingCount = 0;

    @Column(name = "diemBaoPhu", nullable = false, precision = 8, scale = 4)
    @Builder.Default
    private BigDecimal coverageScore = BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);

    @Column(name = "phanTichLuc", nullable = false)
    private LocalDateTime analyzedAt;

    @PrePersist
    @PreUpdate
    private void validateIntegrity() {
        normalizeScreeningMetrics();
        if (candidate == null || resume == null || candidate.getId() == null) {
            return;
        }
        CandidateProfile resumeCandidate = resume.getCandidate();
        if (resumeCandidate != null
                && resumeCandidate.getId() != null
                && !Objects.equals(candidate.getId(), resumeCandidate.getId())) {
            throw new IllegalStateException("SkillGapAnalysis.resume must belong to SkillGapAnalysis.candidate.");
        }
    }

    private void normalizeScreeningMetrics() {
        matchedCount = matchedCount == null ? 0 : matchedCount;
        missingCount = missingCount == null ? 0 : missingCount;

        if (matchedCount < 0 || missingCount < 0) {
            throw new IllegalStateException("Skill gap metrics cannot be negative.");
        }

        int total = matchedCount + missingCount;
        if (total == 0) {
            coverageScore = BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);
            return;
        }

        coverageScore = BigDecimal.valueOf((double) matchedCount / total).setScale(4, RoundingMode.HALF_UP);
    }
}

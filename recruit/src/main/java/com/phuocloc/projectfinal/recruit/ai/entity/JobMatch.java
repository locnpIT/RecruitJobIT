package com.phuocloc.projectfinal.recruit.ai.entity;

import com.phuocloc.projectfinal.recruit.candidate.entity.CandidateProfile;
import com.phuocloc.projectfinal.recruit.candidate.entity.CandidateResume;
import com.phuocloc.projectfinal.recruit.job.entity.Job;
import com.phuocloc.projectfinal.recruit.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
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
@Table(name = "ketQuaPhuHopViecLam")
public class JobMatch extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tinTuyenDungId", nullable = false)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hoSoCvId", nullable = false)
    private CandidateResume resume;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ungVienId", nullable = false)
    private CandidateProfile candidate;

    @Column(name = "diemNguNghia", precision = 8, scale = 4)
    private BigDecimal semanticScore;

    @Column(name = "diemCuoi", precision = 8, scale = 4)
    private BigDecimal finalScore;

    @Column(name = "ghepNoiLuc", nullable = false)
    private LocalDateTime matchedAt;

    @Column(name = "hanDenLuc")
    private LocalDateTime expiresAt;

    @PrePersist
    @PreUpdate
    private void validateIntegrity() {
        if (candidate == null || resume == null || candidate.getId() == null) {
            return;
        }
        CandidateProfile resumeCandidate = resume.getCandidate();
        if (resumeCandidate != null
                && resumeCandidate.getId() != null
                && !Objects.equals(candidate.getId(), resumeCandidate.getId())) {
            throw new IllegalStateException("JobMatch.resume must belong to JobMatch.candidate.");
        }
    }
}

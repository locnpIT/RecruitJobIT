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
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
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
@Table(name = "job_matches")
public class JobMatch extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    private CandidateResume resume;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private CandidateProfile candidate;

    @Column(name = "semantic_score", precision = 8, scale = 4)
    private BigDecimal semanticScore;

    @Column(name = "final_score", precision = 8, scale = 4)
    private BigDecimal finalScore;

    @Column(name = "matched_at", nullable = false)
    private LocalDateTime matchedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
}

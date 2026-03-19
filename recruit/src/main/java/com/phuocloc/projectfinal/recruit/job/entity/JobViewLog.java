package com.phuocloc.projectfinal.recruit.job.entity;

import com.phuocloc.projectfinal.recruit.candidate.entity.CandidateProfile;
import com.phuocloc.projectfinal.recruit.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
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
@Table(
        name = "job_view_log",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_job_view_log_job_session",
                columnNames = {"job_id", "session_id"}
        )
)
public class JobViewLog extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id")
    private CandidateProfile candidate;

    @Column(name = "session_id", nullable = false, length = 120)
    private String sessionId;

    @Column(name = "viewed_at", nullable = false)
    private LocalDateTime viewedAt;
}

package com.phuocloc.projectfinal.recruit.job.entity;

import com.phuocloc.projectfinal.recruit.candidate.entity.CandidateProfile;
import com.phuocloc.projectfinal.recruit.candidate.entity.CandidateResume;
import com.phuocloc.projectfinal.recruit.common.entity.BaseEntity;
import com.phuocloc.projectfinal.recruit.job.enums.ApplicationStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
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
        name = "donUngTuyen",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_job_application_job_candidate",
                columnNames = {"tinTuyenDungId", "ungVienId"}
        )
)
public class JobApplication extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tinTuyenDungId", nullable = false)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ungVienId", nullable = false)
    private CandidateProfile candidate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hoSoCvId")
    private CandidateResume resume;

    @Enumerated(EnumType.STRING)
    @Column(name = "trangThai", nullable = false, length = 20)
    @Builder.Default
    private ApplicationStatus status = ApplicationStatus.PENDING;

    @Column(name = "ungTuyenLuc")
    private LocalDateTime appliedAt;

    @Column(name = "duyetLuc")
    private LocalDateTime reviewedAt;

    @Column(name = "ghiChu", length = 1000)
    private String note;

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
            throw new IllegalStateException("JobApplication.resume must belong to JobApplication.candidate.");
        }
    }
}

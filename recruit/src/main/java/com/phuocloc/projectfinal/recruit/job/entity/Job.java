package com.phuocloc.projectfinal.recruit.job.entity;

import com.phuocloc.projectfinal.recruit.ai.entity.JobEmbeddingIndex;
import com.phuocloc.projectfinal.recruit.auth.entity.Users;
import com.phuocloc.projectfinal.recruit.company.entity.Company;
import com.phuocloc.projectfinal.recruit.company.entity.CompanyBranch;
import com.phuocloc.projectfinal.recruit.company.entity.EmployerProfile;
import com.phuocloc.projectfinal.recruit.common.entity.BaseEntity;
import com.phuocloc.projectfinal.recruit.common.entity.City;
import com.phuocloc.projectfinal.recruit.job.enums.EmploymentType;
import com.phuocloc.projectfinal.recruit.job.enums.ExperienceLevel;
import com.phuocloc.projectfinal.recruit.job.enums.JobStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
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
@Table(name = "tinTuyenDung")
public class Job extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "congTyId", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chiNhanhId", nullable = false)
    private CompanyBranch branch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nguoiTaoNhaTuyenDungId", nullable = false)
    private EmployerProfile createdByEmployer;

    @Column(name = "tieuDe", nullable = false, length = 255)
    private String title;

    @Column(name = "nganhNghe", length = 100)
    private String industry;  // Lĩnh vực ngành nghề của job

    @Column(name = "moTa", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "yeuCau", columnDefinition = "TEXT")
    private String requirements;

    @Column(name = "phucLoi", columnDefinition = "TEXT")
    private String benefits;

    @Enumerated(EnumType.STRING)
    @Column(name = "loaiHinhLamViec", nullable = false, length = 20)
    private EmploymentType employmentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "capDoKinhNghiem", nullable = false, length = 20)
    private ExperienceLevel experienceLevel;

    @Column(name = "luongToiThieu", precision = 15, scale = 2)
    private BigDecimal salaryMin;

    @Column(name = "luongToiDa", precision = 15, scale = 2)
    private BigDecimal salaryMax;

    @Column(name = "diaDiem", length = 255)
    private String location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maTinhThanh")
    private City city;

    @Enumerated(EnumType.STRING)
    @Column(name = "trangThai", nullable = false, length = 20)
    @Builder.Default
    private JobStatus status = JobStatus.DRAFT;

    @Column(name = "lyDoTuChoi", length = 500)
    private String rejectReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "duyetBoi")
    private Users reviewedBy;

    @Column(name = "duyetLuc")
    private LocalDateTime reviewedAt;

    @Column(name = "hanDenLuc")
    private LocalDateTime expiresAt;

    @OneToMany(mappedBy = "job", fetch = FetchType.LAZY)
    private List<JobSkill> jobSkills;

    @OneToMany(mappedBy = "job", fetch = FetchType.LAZY)
    private List<JobApplication> jobApplications;

    @OneToMany(mappedBy = "job", fetch = FetchType.LAZY)
    private List<JobEmbeddingIndex> embeddingIndexes;

    @PrePersist
    @PreUpdate
    private void validateIntegrity() {
        if (company == null || company.getId() == null) {
            return;
        }
        if (branch != null && branch.getCompany() != null && branch.getCompany().getId() != null
                && !Objects.equals(company.getId(), branch.getCompany().getId())) {
            throw new IllegalStateException("Job.branch must belong to Job.company.");
        }
        if (createdByEmployer != null
                && createdByEmployer.getCompany() != null
                && createdByEmployer.getCompany().getId() != null
                && !Objects.equals(company.getId(), createdByEmployer.getCompany().getId())) {
            throw new IllegalStateException("Job.createdByEmployer must belong to Job.company.");
        }
    }
}

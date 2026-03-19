package com.phuocloc.projectfinal.recruit.job.entity;

import com.phuocloc.projectfinal.recruit.auth.entity.Users;
import com.phuocloc.projectfinal.recruit.company.entity.Company;
import com.phuocloc.projectfinal.recruit.company.entity.CompanyBranch;
import com.phuocloc.projectfinal.recruit.company.entity.EmployerProfile;
import com.phuocloc.projectfinal.recruit.common.entity.BaseEntity;
import com.phuocloc.projectfinal.recruit.job.enums.JobStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
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
@Table(name = "job")
public class Job extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private CompanyBranch branch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_employer_id", nullable = false)
    private EmployerProfile createdByEmployer;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    @Column(columnDefinition = "TEXT")
    private String benefits;

    @Column(name = "employment_type", length = 50)
    private String employmentType;

    @Column(name = "experience_level", length = 50)
    private String experienceLevel;

    @Column(name = "salary_min", precision = 15, scale = 2)
    private BigDecimal salaryMin;

    @Column(name = "salary_max", precision = 15, scale = 2)
    private BigDecimal salaryMax;

    @Column(length = 255)
    private String location;

    @Column(length = 120)
    private String city;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private JobStatus status = JobStatus.DRAFT;

    @Column(name = "reject_reason", length = 500)
    private String rejectReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private Users reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @OneToMany(mappedBy = "job", fetch = FetchType.LAZY)
    private List<JobSkill> jobSkills;

    @OneToMany(mappedBy = "job", fetch = FetchType.LAZY)
    private List<JobApplication> jobApplications;

    // ==================== AI EMBEDDING FIELDS ====================
    // Lưu trữ thông tin embedding vector trong Qdrant (vector database)
    // Dùng cho AI matching: tìm job phù hợp với CV và ngược lại

    /**
     * Qdrant Point ID - UUID dùng để query vector từ Qdrant.
     * NULL khi job chưa được embed (ví dụ: job ở trạng thái DRAFT).
     */
    @Column(name = "qdrant_point_id", length = 36, unique = true)
    private String qdrantPointId;

    /**
     * Tên collection trong Qdrant.
     * Mặc định: recruitment_embeddings (chung cho cả CV và Job)
     */
    @Column(name = "qdrant_collection_name", length = 120)
    private String qdrantCollectionName = "recruitment_embeddings";

    /**
     * Số chiều của vector (dimension).
     * Ví dụ: paraphrase-multilingual-MiniLM-L6-v2 = 384 chiều
     */
    @Column(name = "vector_dimension")
    private Integer vectorDimension = 384;

    /**
     * Model AI dùng để tạo embedding.
     * Ví dụ: paraphrase-multilingual-MiniLM-L6-v2
     */
    @Column(name = "embedding_model_name", length = 120)
    private String embeddingModelName;

    /**
     * Version của embedding để biết khi nào cần re-embed.
     * Ví dụ: v1.0, v2.0
     */
    @Column(name = "embedding_version", length = 50)
    private String embeddingVersion;

    /**
     * Thời điểm tạo embedding gần nhất.
     */
    @Column(name = "embedded_at")
    private LocalDateTime embeddedAt;
}

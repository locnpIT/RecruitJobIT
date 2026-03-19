package com.phuocloc.projectfinal.recruit.candidate.entity;

import com.phuocloc.projectfinal.recruit.job.entity.JobApplication;
import com.phuocloc.projectfinal.recruit.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
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
@Table(name = "candidate_resume")
public class CandidateResume extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private CandidateProfile candidate;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_url", nullable = false, length = 1000)
    private String fileUrl;

    @Column(name = "file_type", nullable = false, length = 30)
    private String fileType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "extracted_text", columnDefinition = "TEXT")
    private String extractedText;

    @Column(name = "parsed_skills_text", columnDefinition = "TEXT")
    private String parsedSkillsText;

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

    @OneToMany(mappedBy = "resume", fetch = FetchType.LAZY)
    private List<JobApplication> jobApplications;

    // ==================== AI EMBEDDING FIELDS ====================
    // Lưu trữ thông tin embedding vector trong Qdrant (vector database)
    // Dùng cho AI matching: tìm job phù hợp với CV

    /**
     * Qdrant Point ID - UUID dùng để query vector từ Qdrant.
     * NULL khi CV chưa được embed (chưa xử lý xong).
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

    /**
     * Thời điểm re-embed gần nhất (nếu có).
     */
    @Column(name = "last_reembedded_at")
    private LocalDateTime lastReembeddedAt;
}

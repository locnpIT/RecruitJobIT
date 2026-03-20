package com.phuocloc.projectfinal.recruit.ai.entity;

import com.phuocloc.projectfinal.recruit.ai.enums.EmbeddingProvider;
import com.phuocloc.projectfinal.recruit.ai.enums.EmbeddingStatus;
import com.phuocloc.projectfinal.recruit.candidate.entity.CandidateResume;
import com.phuocloc.projectfinal.recruit.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
        name = "resume_embedding_index",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_resume_embedding_point_id", columnNames = "point_id"),
                @UniqueConstraint(
                        name = "uk_resume_embedding_resume_model_version",
                        columnNames = {"resume_id", "model_name", "embedding_version"}
                )
        }
)
public class ResumeEmbeddingIndex extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    private CandidateResume resume;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EmbeddingProvider provider = EmbeddingProvider.QDRANT;

    @Column(name = "collection_name", nullable = false, length = 120)
    @Builder.Default
    private String collectionName = "recruitment_embeddings";

    @Column(name = "point_id", nullable = false, length = 64)
    private String pointId;

    @Column(name = "model_name", nullable = false, length = 120)
    private String modelName;

    @Column(name = "embedding_version", nullable = false, length = 50)
    private String embeddingVersion;

    @Column(name = "vector_dimension", nullable = false)
    private Integer vectorDimension;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EmbeddingStatus status = EmbeddingStatus.PENDING;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "embedded_at")
    private LocalDateTime embeddedAt;

    @Column(name = "last_error", length = 500)
    private String lastError;
}

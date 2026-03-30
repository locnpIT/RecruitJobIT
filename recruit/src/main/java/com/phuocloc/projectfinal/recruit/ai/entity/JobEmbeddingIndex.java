package com.phuocloc.projectfinal.recruit.ai.entity;

import com.phuocloc.projectfinal.recruit.ai.enums.EmbeddingProvider;
import com.phuocloc.projectfinal.recruit.ai.enums.EmbeddingStatus;
import com.phuocloc.projectfinal.recruit.common.entity.BaseEntity;
import com.phuocloc.projectfinal.recruit.job.entity.Job;
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
        name = "chiMucNhungTinTuyenDung",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_job_embedding_point_id", columnNames = "maDiem"),
                @UniqueConstraint(
                        name = "uk_job_embedding_job_model_version",
                        columnNames = {"tinTuyenDungId", "tenMoHinh", "phienBanNhung"}
                )
        }
)
public class JobEmbeddingIndex extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tinTuyenDungId", nullable = false)
    private Job job;

    @Enumerated(EnumType.STRING)
    @Column(name = "nhaCungCap", nullable = false, length = 20)
    @Builder.Default
    private EmbeddingProvider provider = EmbeddingProvider.QDRANT;

    @Column(name = "tenBoSuuTap", nullable = false, length = 120)
    @Builder.Default
    private String collectionName = "recruitment_embeddings";

    @Column(name = "maDiem", nullable = false, length = 64)
    private String pointId;

    @Column(name = "tenMoHinh", nullable = false, length = 120)
    private String modelName;

    @Column(name = "phienBanNhung", nullable = false, length = 50)
    private String embeddingVersion;

    @Column(name = "kichThuocVector", nullable = false)
    private Integer vectorDimension;

    @Enumerated(EnumType.STRING)
    @Column(name = "trangThai", nullable = false, length = 20)
    @Builder.Default
    private EmbeddingStatus status = EmbeddingStatus.PENDING;

    @Column(name = "dangHoatDong", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "nhungLuc")
    private LocalDateTime embeddedAt;

    @Column(name = "loiGanNhat", length = 500)
    private String lastError;
}

package com.phuocloc.projectfinal.recruit.candidate.entity;

import com.phuocloc.projectfinal.recruit.ai.entity.ResumeEmbeddingIndex;
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
    @Builder.Default
    private Boolean isDefault = false;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

    @OneToMany(mappedBy = "resume", fetch = FetchType.LAZY)
    private List<JobApplication> jobApplications;

    @OneToMany(mappedBy = "resume", fetch = FetchType.LAZY)
    private List<ResumeEmbeddingIndex> embeddingIndexes;
}

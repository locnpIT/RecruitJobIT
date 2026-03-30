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
@Table(name = "hoSoCvUngVien")
public class CandidateResume extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ungVienId", nullable = false)
    private CandidateProfile candidate;

    @Column(name = "tenTep", nullable = false, length = 255)
    private String fileName;

    @Column(name = "duongDanTep", nullable = false, length = 1000)
    private String fileUrl;

    @Column(name = "loaiTep", nullable = false, length = 30)
    private String fileType;

    @Column(name = "kichThuocTep")
    private Long fileSize;

    @Column(name = "vanBanTrichXuat", columnDefinition = "TEXT")
    private String extractedText;

    @Column(name = "vanBanKyNangPhanTich", columnDefinition = "TEXT")
    private String parsedSkillsText;

    @Column(name = "macDinh", nullable = false)
    @Builder.Default
    private Boolean isDefault = false;

    @Column(name = "taiLenLuc")
    private LocalDateTime uploadedAt;

    @OneToMany(mappedBy = "resume", fetch = FetchType.LAZY)
    private List<JobApplication> jobApplications;

    @OneToMany(mappedBy = "resume", fetch = FetchType.LAZY)
    private List<ResumeEmbeddingIndex> embeddingIndexes;
}

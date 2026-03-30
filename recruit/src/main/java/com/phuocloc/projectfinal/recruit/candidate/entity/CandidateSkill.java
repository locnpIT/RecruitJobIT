package com.phuocloc.projectfinal.recruit.candidate.entity;

import com.phuocloc.projectfinal.recruit.job.entity.Skill;
import com.phuocloc.projectfinal.recruit.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
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
        name = "kyNangUngVien",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_candidate_skill_candidate_skill",
                columnNames = {"hoSoUngVienId", "kyNangId"}
        )
)
public class CandidateSkill extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hoSoUngVienId", nullable = false)
    private CandidateProfile candidateProfile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kyNangId", nullable = false)
    private Skill skill;

    @Column(name = "capDo", length = 50)
    private String level;

    @Column(name = "soNamKinhNghiem")
    private Integer yearsOfExperience;
}

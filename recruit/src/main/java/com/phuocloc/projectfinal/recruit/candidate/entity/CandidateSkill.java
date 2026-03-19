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
        name = "candidate_skill",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_candidate_skill_candidate_skill",
                columnNames = {"candidate_profile_id", "skill_id"}
        )
)
public class CandidateSkill extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_profile_id", nullable = false)
    private CandidateProfile candidateProfile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;

    @Column(length = 50)
    private String level;

    @Column(name = "years_of_experience")
    private Integer yearsOfExperience;
}

package com.phuocloc.projectfinal.recruit.job.entity;

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
        name = "kyNangTinTuyenDung",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_job_skill_job_skill",
                columnNames = {"tinTuyenDungId", "kyNangId"}
        )
)
public class JobSkill extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tinTuyenDungId", nullable = false)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kyNangId", nullable = false)
    private Skill skill;

    @Column(name = "batBuoc", nullable = false)
    @Builder.Default
    private Boolean isRequired = true;

    @Column(name = "diemUuTien")
    private Integer priorityScore;
}

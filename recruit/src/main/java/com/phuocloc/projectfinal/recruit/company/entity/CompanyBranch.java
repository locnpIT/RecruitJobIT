package com.phuocloc.projectfinal.recruit.company.entity;

import com.phuocloc.projectfinal.recruit.job.entity.Job;
import com.phuocloc.projectfinal.recruit.common.entity.BaseEntity;
import com.phuocloc.projectfinal.recruit.common.entity.City;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
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
@Table(name = "chiNhanhCongTy")
public class CompanyBranch extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "congTyId", nullable = false)
    private Company company;

    @Column(name = "ten", nullable = false, length = 200)
    private String name;

    @Column(name = "diaChi", length = 500)
    private String address;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maTinhThanh")
    private City city;

    @Column(name = "laTruSoChinh", nullable = false)
    @Builder.Default
    private Boolean isHeadquarter = false;

    @OneToMany(mappedBy = "branch", fetch = FetchType.LAZY)
    private List<EmployerProfile> employerProfiles;

    @OneToMany(mappedBy = "branch", fetch = FetchType.LAZY)
    private List<Job> jobs;
}

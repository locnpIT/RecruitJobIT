package com.phuocloc.projectfinal.recruit.company.entity;

import com.phuocloc.projectfinal.recruit.auth.entity.Users;
import com.phuocloc.projectfinal.recruit.job.entity.Job;
import com.phuocloc.projectfinal.recruit.common.entity.BaseEntity;
import com.phuocloc.projectfinal.recruit.company.enums.EmployerCompanyRole;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
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
@Table(name = "employer_profile")
public class EmployerProfile extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private Users user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private CompanyBranch branch;

    @Enumerated(EnumType.STRING)
    @Column(name = "company_role", nullable = false, length = 20)
    private EmployerCompanyRole companyRole;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_by")
    private EmployerProfile invitedBy;

    @OneToMany(mappedBy = "invitedBy", fetch = FetchType.LAZY)
    private List<EmployerProfile> invitedEmployers;

    @OneToMany(mappedBy = "createdByEmployer", fetch = FetchType.LAZY)
    private List<Job> createdJobs;
}

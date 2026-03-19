package com.phuocloc.projectfinal.recruit.company.entity;

import com.phuocloc.projectfinal.recruit.auth.entity.Users;
import com.phuocloc.projectfinal.recruit.job.entity.Job;
import com.phuocloc.projectfinal.recruit.common.entity.BaseEntity;
import com.phuocloc.projectfinal.recruit.company.enums.CompanyStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
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
@Table(
        name = "company",
        uniqueConstraints = @UniqueConstraint(name = "uk_company_tax_code", columnNames = "tax_code")
)
public class Company extends BaseEntity {

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "tax_code", nullable = false, length = 50)
    private String taxCode;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 255)
    private String website;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;

    @Column(length = 500)
    private String address;

    @Column(length = 120)
    private String city;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CompanyStatus status = CompanyStatus.PENDING;

    @Column(name = "reject_reason", length = 500)
    private String rejectReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private Users reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @OneToMany(mappedBy = "company", fetch = FetchType.LAZY)
    private List<CompanyBranch> branches;

    @OneToMany(mappedBy = "company", fetch = FetchType.LAZY)
    private List<EmployerProfile> employerProfiles;

    @OneToMany(mappedBy = "company", fetch = FetchType.LAZY)
    private List<Job> jobs;

    @OneToMany(mappedBy = "company", fetch = FetchType.LAZY)
    private List<Subscription> subscriptions;
}

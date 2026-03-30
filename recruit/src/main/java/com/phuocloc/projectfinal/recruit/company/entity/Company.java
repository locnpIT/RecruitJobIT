package com.phuocloc.projectfinal.recruit.company.entity;

import com.phuocloc.projectfinal.recruit.auth.entity.Users;
import com.phuocloc.projectfinal.recruit.job.entity.Job;
import com.phuocloc.projectfinal.recruit.common.entity.BaseEntity;
import com.phuocloc.projectfinal.recruit.common.entity.City;
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
        name = "congTy",
        uniqueConstraints = @UniqueConstraint(name = "uk_company_tax_code", columnNames = "maSoThue")
)
public class Company extends BaseEntity {

    @Column(name = "ten", nullable = false, length = 200)
    private String name;

    @Column(name = "maSoThue", nullable = false, length = 50)
    private String taxCode;

    @Column(name = "moTa", columnDefinition = "TEXT")
    private String description;

    @Column(name = "website", length = 255)
    private String website;

    @Column(name = "logoUrl", length = 500)
    private String logoUrl;

    @Column(name = "anhBiaUrl", length = 500)
    private String coverImageUrl;

    @Column(name = "diaChi", length = 500)
    private String address;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maTinhThanh")
    private City city;

    @Enumerated(EnumType.STRING)
    @Column(name = "trangThai", nullable = false, length = 20)
    @Builder.Default
    private CompanyStatus status = CompanyStatus.PENDING;

    @Column(name = "lyDoTuChoi", length = 500)
    private String rejectReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "duyetBoi")
    private Users reviewedBy;

    @Column(name = "duyetLuc")
    private LocalDateTime reviewedAt;

    @OneToMany(mappedBy = "company", fetch = FetchType.LAZY)
    private List<CompanyBranch> branches;

    @OneToMany(mappedBy = "company", fetch = FetchType.LAZY)
    private List<EmployerProfile> employerProfiles;

    @OneToMany(mappedBy = "company", fetch = FetchType.LAZY)
    private List<Job> jobs;

    @OneToMany(mappedBy = "company", fetch = FetchType.LAZY)
    private List<Subscription> subscriptions;

    @OneToMany(mappedBy = "company", fetch = FetchType.LAZY)
    private List<CompanyProofDocument> proofDocuments;
}

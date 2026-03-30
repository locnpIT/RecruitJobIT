package com.phuocloc.projectfinal.recruit.candidate.entity;

import com.phuocloc.projectfinal.recruit.auth.entity.Users;
import com.phuocloc.projectfinal.recruit.job.entity.JobApplication;
import com.phuocloc.projectfinal.recruit.common.entity.BaseEntity;
import com.phuocloc.projectfinal.recruit.common.entity.City;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
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
@Table(name = "hoSoUngVien")
public class CandidateProfile extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nguoiDungId", nullable = false, unique = true)
    private Users user;

    @Column(name = "tieuDeCaNhan", length = 255)
    private String headline;

    @Column(name = "ngaySinh")
    private LocalDate dateOfBirth;

    @Column(name = "gioiTinh", length = 30)
    private String gender;

    @Column(name = "diaChi", length = 500)
    private String address;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maTinhThanh")
    private City city;

    @Column(name = "soNamKinhNghiem")
    private Integer yearsOfExperience;

    @Column(name = "trinhDoHocVan", length = 120)
    private String educationLevel;

    @Column(name = "gioiThieu", columnDefinition = "TEXT")
    private String bio;

    @OneToMany(mappedBy = "candidateProfile", fetch = FetchType.LAZY)
    private List<CandidateSkill> candidateSkills;

    @OneToMany(mappedBy = "candidate", fetch = FetchType.LAZY)
    private List<CandidateResume> resumes;

    @OneToMany(mappedBy = "candidate", fetch = FetchType.LAZY)
    private List<JobApplication> jobApplications;
}

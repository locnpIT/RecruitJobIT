package com.phuocloc.projectfinal.recruit.candidate.entity;

import com.phuocloc.projectfinal.recruit.auth.entity.Users;
import com.phuocloc.projectfinal.recruit.job.entity.JobApplication;
import com.phuocloc.projectfinal.recruit.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
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
@Table(name = "candidate_profile")
public class CandidateProfile extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private Users user;

    @Column(length = 255)
    private String headline;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(length = 30)
    private String gender;

    @Column(length = 500)
    private String address;

    @Column(length = 120)
    private String city;

    @Column(name = "expected_salary", precision = 15, scale = 2)
    private BigDecimal expectedSalary;

    @Column(name = "years_of_experience")
    private Integer yearsOfExperience;

    @Column(name = "education_level", length = 120)
    private String educationLevel;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @OneToMany(mappedBy = "candidateProfile", fetch = FetchType.LAZY)
    private List<CandidateSkill> candidateSkills;

    @OneToMany(mappedBy = "candidate", fetch = FetchType.LAZY)
    private List<CandidateResume> resumes;

    @OneToMany(mappedBy = "candidate", fetch = FetchType.LAZY)
    private List<JobApplication> jobApplications;
}

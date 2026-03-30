package com.phuocloc.projectfinal.recruit.auth.entity;

import com.phuocloc.projectfinal.recruit.candidate.entity.CandidateProfile;
import com.phuocloc.projectfinal.recruit.company.entity.EmployerProfile;
import com.phuocloc.projectfinal.recruit.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
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
        name = "nguoiDung",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_users_email", columnNames = "email")
        }
)
public class Users extends BaseEntity {

    @Column(name = "email", nullable = false, length = 150)
    private String email;

    @Column(name = "matKhauBam", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "ho", nullable = false, length = 100)
    private String lastName;

    @Column(name = "ten", nullable = false, length = 100)
    private String firstName;

    @Column(name = "soDienThoai", length = 20)
    private String phoneNumber;

    @Column(name = "anhDaiDienUrl", length = 10000)
    private String avatarUrl;

    @Column(name = "dangHoatDong", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "biKhoa", nullable = false)
    @Builder.Default
    private Boolean isLocked = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vaiTroId", nullable = false)
    private Roles role;

    @OneToOne(mappedBy = "user", fetch = FetchType.LAZY)
    private CandidateProfile candidateProfile;

    @OneToOne(mappedBy = "user", fetch = FetchType.LAZY)
    private EmployerProfile employerProfile;
}

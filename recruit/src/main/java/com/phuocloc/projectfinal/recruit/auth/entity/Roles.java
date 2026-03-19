package com.phuocloc.projectfinal.recruit.auth.entity;

import com.phuocloc.projectfinal.recruit.common.entity.BaseEntity;
import com.phuocloc.projectfinal.recruit.auth.enums.RoleName;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
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
@Table(name = "role")
public class Roles extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true, length = 20)
    private RoleName name;

    @Column(length = 500)
    private String description;

    @OneToMany(mappedBy = "role", fetch = FetchType.LAZY)
    private List<Users> users;
}

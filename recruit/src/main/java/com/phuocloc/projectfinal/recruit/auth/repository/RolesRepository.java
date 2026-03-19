package com.phuocloc.projectfinal.recruit.auth.repository;

import com.phuocloc.projectfinal.recruit.auth.entity.Roles;
import com.phuocloc.projectfinal.recruit.auth.enums.RoleName;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RolesRepository extends JpaRepository<Roles, Long> {

    Optional<Roles> findByName(RoleName name);

    boolean existsByName(RoleName name);
}

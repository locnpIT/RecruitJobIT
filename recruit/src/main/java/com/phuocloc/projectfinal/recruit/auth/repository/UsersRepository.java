package com.phuocloc.projectfinal.recruit.auth.repository;

import com.phuocloc.projectfinal.recruit.auth.entity.Users;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsersRepository extends JpaRepository<Users, Long> {

    Optional<Users> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Users> findByRole_Id(Long roleId);
}

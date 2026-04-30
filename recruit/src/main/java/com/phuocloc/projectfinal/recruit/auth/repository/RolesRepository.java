package com.phuocloc.projectfinal.recruit.auth.repository;

import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.VaiTroHeThong;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RolesRepository extends JpaRepository<VaiTroHeThong, Integer> {

    Optional<VaiTroHeThong> findByTen(String ten);

    boolean existsByTen(String ten);
}

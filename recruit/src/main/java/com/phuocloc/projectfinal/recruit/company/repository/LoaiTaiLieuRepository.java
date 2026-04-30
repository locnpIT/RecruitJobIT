package com.phuocloc.projectfinal.recruit.company.repository;

import com.phuocloc.projectfinal.recruit.domain.congty.entity.LoaiTaiLieu;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoaiTaiLieuRepository extends JpaRepository<LoaiTaiLieu, Integer> {

    Optional<LoaiTaiLieu> findByTenIgnoreCase(String ten);
}

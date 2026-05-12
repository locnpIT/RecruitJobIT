package com.phuocloc.projectfinal.recruit.domain.nghenghiep.repository;

import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.LoaiHinhLamViec;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoaiHinhLamViecRepository extends JpaRepository<LoaiHinhLamViec, Integer> {

    Optional<LoaiHinhLamViec> findByTenIgnoreCase(String ten);
}

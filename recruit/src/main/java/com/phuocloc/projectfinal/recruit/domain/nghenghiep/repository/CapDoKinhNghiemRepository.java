package com.phuocloc.projectfinal.recruit.domain.nghenghiep.repository;

import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.CapDoKinhNghiem;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CapDoKinhNghiemRepository extends JpaRepository<CapDoKinhNghiem, Integer> {

    Optional<CapDoKinhNghiem> findByTenIgnoreCase(String ten);
}

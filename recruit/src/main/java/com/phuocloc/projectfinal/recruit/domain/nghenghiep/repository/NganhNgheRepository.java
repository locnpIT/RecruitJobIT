package com.phuocloc.projectfinal.recruit.domain.nghenghiep.repository;

import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.NganhNghe;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NganhNgheRepository extends JpaRepository<NganhNghe, Integer> {

    Optional<NganhNghe> findByTenIgnoreCase(String ten);
}

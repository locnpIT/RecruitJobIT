package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.KyNang;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KyNangRepository extends JpaRepository<KyNang, Integer> {
    List<KyNang> findAllByOrderByTenAsc();
}

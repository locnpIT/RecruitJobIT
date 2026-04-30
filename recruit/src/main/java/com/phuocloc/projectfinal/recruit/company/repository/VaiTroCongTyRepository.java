package com.phuocloc.projectfinal.recruit.company.repository;

import com.phuocloc.projectfinal.recruit.domain.congty.entity.VaiTroCongTy;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VaiTroCongTyRepository extends JpaRepository<VaiTroCongTy, Integer> {

    Optional<VaiTroCongTy> findByTenIgnoreCase(String ten);
}

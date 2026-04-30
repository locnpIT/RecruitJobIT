package com.phuocloc.projectfinal.recruit.company.repository;

import com.phuocloc.projectfinal.recruit.domain.congty.entity.ChiNhanhCongTy;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyBranchRepository extends JpaRepository<ChiNhanhCongTy, Integer> {

    List<ChiNhanhCongTy> findByCongTy_Id(Integer congTyId);

    Optional<ChiNhanhCongTy> findByCongTy_IdAndLaTruSoChinhTrue(Integer congTyId);
}

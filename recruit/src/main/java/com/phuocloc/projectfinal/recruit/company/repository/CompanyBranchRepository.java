package com.phuocloc.projectfinal.recruit.company.repository;

import com.phuocloc.projectfinal.recruit.domain.congty.entity.ChiNhanhCongTy;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/**
 * Repository truy cập dữ liệu cho CompanyBranchRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface CompanyBranchRepository extends JpaRepository<ChiNhanhCongTy, Integer> {

    @Query("SELECT c FROM ChiNhanhCongTy c WHERE c.congTy.id = :congTyId")
    List<ChiNhanhCongTy> findByCongTy_Id(Integer congTyId);

    @Query("""
            SELECT c FROM ChiNhanhCongTy c
            WHERE c.congTy.id = :congTyId
              AND c.laTruSoChinh = TRUE
            """)
    Optional<ChiNhanhCongTy> findByCongTy_IdAndLaTruSoChinhTrue(Integer congTyId);

    @Query("""
            SELECT c FROM ChiNhanhCongTy c
            WHERE c.id = :branchId
              AND c.congTy.id = :congTyId
            """)
    Optional<ChiNhanhCongTy> findByIdAndCongTy_Id(Integer branchId, Integer congTyId);
}

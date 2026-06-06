package com.phuocloc.projectfinal.recruit.company.repository;

import com.phuocloc.projectfinal.recruit.domain.congty.entity.VaiTroCongTy;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/**
 * Repository truy cập dữ liệu cho VaiTroCongTyRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface VaiTroCongTyRepository extends JpaRepository<VaiTroCongTy, Integer> {

    @Query("SELECT v FROM VaiTroCongTy v WHERE UPPER(v.ten) = UPPER(:ten)")
    Optional<VaiTroCongTy> findByTenIgnoreCase(String ten);

    @Query("""
            SELECT CASE WHEN COUNT(v) > 0 THEN TRUE ELSE FALSE END
            FROM VaiTroCongTy v
            WHERE UPPER(v.ten) = UPPER(:ten)
            """)
    boolean existsByTenIgnoreCase(String ten);

    @Query("SELECT v FROM VaiTroCongTy v ORDER BY v.id ASC")
    List<VaiTroCongTy> findAllByOrderByIdAsc();
}

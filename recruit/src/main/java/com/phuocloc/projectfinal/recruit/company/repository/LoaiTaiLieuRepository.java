package com.phuocloc.projectfinal.recruit.company.repository;

import com.phuocloc.projectfinal.recruit.domain.congty.entity.LoaiTaiLieu;
import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/**
 * Repository truy cập dữ liệu cho LoaiTaiLieuRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface LoaiTaiLieuRepository extends JpaRepository<LoaiTaiLieu, Integer> {

    @Query("SELECT l FROM LoaiTaiLieu l WHERE UPPER(l.ten) = UPPER(:ten)")
    Optional<LoaiTaiLieu> findByTenIgnoreCase(String ten);

    @Query("SELECT l FROM LoaiTaiLieu l ORDER BY l.id ASC")
    List<LoaiTaiLieu> findAllByOrderByIdAsc();

    @Query("""
            SELECT CASE WHEN COUNT(l) > 0 THEN TRUE ELSE FALSE END
            FROM LoaiTaiLieu l
            WHERE UPPER(l.ten) = UPPER(:ten)
            """)
    boolean existsByTenIgnoreCase(String ten);
}

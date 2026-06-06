package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.LoaiChungChi;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/**
 * Repository truy cập dữ liệu cho LoaiChungChiRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface LoaiChungChiRepository extends JpaRepository<LoaiChungChi, Integer> {
    @Query("SELECT l FROM LoaiChungChi l ORDER BY l.ten ASC")
    List<LoaiChungChi> findAllByOrderByTenAsc();

    @Query("SELECT l FROM LoaiChungChi l WHERE UPPER(l.ten) = UPPER(:ten)")
    Optional<LoaiChungChi> findByTenIgnoreCase(String ten);

    @Query("""
            SELECT CASE WHEN COUNT(l) > 0 THEN TRUE ELSE FALSE END
            FROM LoaiChungChi l
            WHERE UPPER(l.ten) = UPPER(:ten)
            """)
    boolean existsByTenIgnoreCase(String ten);
}

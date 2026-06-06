package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.KyNang;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/**
 * Repository truy cập dữ liệu cho KyNangRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface KyNangRepository extends JpaRepository<KyNang, Integer> {
    @Query("SELECT k FROM KyNang k ORDER BY k.ten ASC")
    List<KyNang> findAllByOrderByTenAsc();
}

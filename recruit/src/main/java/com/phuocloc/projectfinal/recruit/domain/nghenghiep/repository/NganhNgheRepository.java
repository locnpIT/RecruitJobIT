package com.phuocloc.projectfinal.recruit.domain.nghenghiep.repository;

import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.NganhNghe;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/**
 * Repository truy cập dữ liệu cho NganhNgheRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface NganhNgheRepository extends JpaRepository<NganhNghe, Integer> {

    @Query("SELECT n FROM NganhNghe n WHERE UPPER(n.ten) = UPPER(:ten)")
    Optional<NganhNghe> findByTenIgnoreCase(String ten);

    @Query("SELECT n FROM NganhNghe n ORDER BY n.ten ASC")
    List<NganhNghe> findAllByOrderByTenAsc();
}

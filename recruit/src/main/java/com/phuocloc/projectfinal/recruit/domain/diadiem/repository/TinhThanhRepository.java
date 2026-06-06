package com.phuocloc.projectfinal.recruit.domain.diadiem.repository;

import com.phuocloc.projectfinal.recruit.domain.diadiem.entity.TinhThanh;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/**
 * Repository truy cập dữ liệu cho TinhThanhRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface TinhThanhRepository extends JpaRepository<TinhThanh, Integer> {

    @Query("SELECT t FROM TinhThanh t WHERE UPPER(t.ten) = UPPER(:ten)")
    Optional<TinhThanh> findByTenIgnoreCase(String ten);
}

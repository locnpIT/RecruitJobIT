package com.phuocloc.projectfinal.recruit.company.repository;

import com.phuocloc.projectfinal.recruit.domain.congty.entity.LoaiTaiLieu;
import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository truy cập dữ liệu cho LoaiTaiLieuRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface LoaiTaiLieuRepository extends JpaRepository<LoaiTaiLieu, Integer> {

    Optional<LoaiTaiLieu> findByTenIgnoreCase(String ten);

    List<LoaiTaiLieu> findAllByOrderByIdAsc();

    boolean existsByTenIgnoreCase(String ten);
}

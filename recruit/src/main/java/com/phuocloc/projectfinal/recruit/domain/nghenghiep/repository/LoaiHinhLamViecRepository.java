package com.phuocloc.projectfinal.recruit.domain.nghenghiep.repository;

import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.LoaiHinhLamViec;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository truy cập dữ liệu cho LoaiHinhLamViecRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface LoaiHinhLamViecRepository extends JpaRepository<LoaiHinhLamViec, Integer> {

    Optional<LoaiHinhLamViec> findByTenIgnoreCase(String ten);
}

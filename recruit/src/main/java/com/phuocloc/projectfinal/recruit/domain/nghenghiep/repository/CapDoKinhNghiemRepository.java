package com.phuocloc.projectfinal.recruit.domain.nghenghiep.repository;

import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.CapDoKinhNghiem;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository truy cập dữ liệu cho CapDoKinhNghiemRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface CapDoKinhNghiemRepository extends JpaRepository<CapDoKinhNghiem, Integer> {

    Optional<CapDoKinhNghiem> findByTenIgnoreCase(String ten);
}

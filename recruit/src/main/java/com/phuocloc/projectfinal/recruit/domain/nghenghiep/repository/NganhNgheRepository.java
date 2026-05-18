package com.phuocloc.projectfinal.recruit.domain.nghenghiep.repository;

import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.NganhNghe;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository truy cập dữ liệu cho NganhNgheRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface NganhNgheRepository extends JpaRepository<NganhNghe, Integer> {

    Optional<NganhNghe> findByTenIgnoreCase(String ten);

    List<NganhNghe> findAllByOrderByTenAsc();
}

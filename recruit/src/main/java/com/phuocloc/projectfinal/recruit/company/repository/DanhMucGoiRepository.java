package com.phuocloc.projectfinal.recruit.company.repository;

import com.phuocloc.projectfinal.recruit.domain.congty.entity.DanhMucGoi;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository truy cập dữ liệu cho DanhMucGoiRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface DanhMucGoiRepository extends JpaRepository<DanhMucGoi, Integer> {

    Optional<DanhMucGoi> findByMaGoiIgnoreCase(String maGoi);

    List<DanhMucGoi> findAllByOrderByIdAsc();
}

package com.phuocloc.projectfinal.recruit.company.repository;

import com.phuocloc.projectfinal.recruit.domain.congty.entity.DanhMucGoi;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/**
 * Repository truy cập dữ liệu cho DanhMucGoiRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface DanhMucGoiRepository extends JpaRepository<DanhMucGoi, Integer> {

    @Query("SELECT d FROM DanhMucGoi d WHERE UPPER(d.maGoi) = UPPER(:maGoi)")
    Optional<DanhMucGoi> findByMaGoiIgnoreCase(String maGoi);

    @Query("SELECT d FROM DanhMucGoi d ORDER BY d.id ASC")
    List<DanhMucGoi> findAllByOrderByIdAsc();
}

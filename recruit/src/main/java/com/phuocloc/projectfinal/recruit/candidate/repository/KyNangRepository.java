package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.KyNang;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository truy cập dữ liệu cho KyNangRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface KyNangRepository extends JpaRepository<KyNang, Integer> {
    List<KyNang> findAllByOrderByTenAsc();
}

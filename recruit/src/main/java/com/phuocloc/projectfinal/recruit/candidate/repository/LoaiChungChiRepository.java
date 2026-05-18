package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.LoaiChungChi;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository truy cập dữ liệu cho LoaiChungChiRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface LoaiChungChiRepository extends JpaRepository<LoaiChungChi, Integer> {
    List<LoaiChungChi> findAllByOrderByTenAsc();

    Optional<LoaiChungChi> findByTenIgnoreCase(String ten);

    boolean existsByTenIgnoreCase(String ten);
}

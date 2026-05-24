package com.phuocloc.projectfinal.recruit.domain.ai.repository;

import com.phuocloc.projectfinal.recruit.domain.ai.entity.ChiMucNhungHoSoUngVien;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository truy cập dữ liệu cho ChiMucNhungHoSoUngVienRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface ChiMucNhungHoSoUngVienRepository extends JpaRepository<ChiMucNhungHoSoUngVien, Integer> {

    Optional<ChiMucNhungHoSoUngVien> findFirstByHoSoUngVien_IdOrderByIdDesc(Integer hoSoUngVienId);
}

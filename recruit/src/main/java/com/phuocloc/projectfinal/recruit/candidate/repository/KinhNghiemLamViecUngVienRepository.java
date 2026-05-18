package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.KinhNghiemLamViecUngVien;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository truy cập dữ liệu cho KinhNghiemLamViecUngVienRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface KinhNghiemLamViecUngVienRepository extends JpaRepository<KinhNghiemLamViecUngVien, Integer> {
    List<KinhNghiemLamViecUngVien> findByHoSoUngVien_IdOrderByThoiGianBatDauDesc(Integer hoSoUngVienId);
}

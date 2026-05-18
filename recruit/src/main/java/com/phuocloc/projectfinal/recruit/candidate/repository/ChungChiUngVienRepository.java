package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.ChungChiUngVien;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository truy cập dữ liệu cho ChungChiUngVienRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface ChungChiUngVienRepository extends JpaRepository<ChungChiUngVien, Integer> {
    List<ChungChiUngVien> findByHoSoUngVien_IdOrderByNgayBatDauDesc(Integer hoSoUngVienId);

    List<ChungChiUngVien> findByTrangThaiOrderByIdDesc(String trangThai);
}

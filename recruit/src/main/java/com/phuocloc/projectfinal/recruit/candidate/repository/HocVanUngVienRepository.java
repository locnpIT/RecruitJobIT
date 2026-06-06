package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HocVanUngVien;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/**
 * Repository truy cập dữ liệu cho HocVanUngVienRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface HocVanUngVienRepository extends JpaRepository<HocVanUngVien, Integer> {
    @Query("SELECT h FROM HocVanUngVien h WHERE h.nguoiDung.id = :nguoiDungId ORDER BY h.thoiGianBatDau desc")
    List<HocVanUngVien> findByNguoiDung_IdOrderByThoiGianBatDauDesc(Integer nguoiDungId);

    @Query("SELECT h FROM HocVanUngVien h WHERE h.trangThai = :trangThai ORDER BY h.id desc")
    List<HocVanUngVien> findByTrangThaiOrderByIdDesc(String trangThai);
}

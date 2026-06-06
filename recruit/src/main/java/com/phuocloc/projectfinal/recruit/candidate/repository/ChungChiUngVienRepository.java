package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.ChungChiUngVien;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/**
 * Repository truy cập dữ liệu cho ChungChiUngVienRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface ChungChiUngVienRepository extends JpaRepository<ChungChiUngVien, Integer> {
    @Query("SELECT c FROM ChungChiUngVien c WHERE c.nguoiDung.id = :nguoiDungId ORDER BY c.ngayBatDau desc")
    List<ChungChiUngVien> findByNguoiDung_IdOrderByNgayBatDauDesc(Integer nguoiDungId);

    @Query("SELECT c FROM ChungChiUngVien c WHERE c.trangThai = :trangThai ORDER BY c.id desc")
    List<ChungChiUngVien> findByTrangThaiOrderByIdDesc(String trangThai);
}

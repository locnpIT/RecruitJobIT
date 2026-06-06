package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.KinhNghiemLamViecUngVien;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/**
 * Repository truy cập dữ liệu cho KinhNghiemLamViecUngVienRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface KinhNghiemLamViecUngVienRepository extends JpaRepository<KinhNghiemLamViecUngVien, Integer> {
    @Query("""
            SELECT k FROM KinhNghiemLamViecUngVien k
            WHERE k.nguoiDung.id = :nguoiDungId
            ORDER BY k.thoiGianBatDau DESC
            """)
    List<KinhNghiemLamViecUngVien> findByNguoiDung_IdOrderByThoiGianBatDauDesc(Integer nguoiDungId);
}

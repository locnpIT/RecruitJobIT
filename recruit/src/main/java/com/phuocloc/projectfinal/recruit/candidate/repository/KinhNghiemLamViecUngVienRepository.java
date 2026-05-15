package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.KinhNghiemLamViecUngVien;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KinhNghiemLamViecUngVienRepository extends JpaRepository<KinhNghiemLamViecUngVien, Integer> {
    List<KinhNghiemLamViecUngVien> findByHoSoUngVien_IdOrderByThoiGianBatDauDesc(Integer hoSoUngVienId);
}

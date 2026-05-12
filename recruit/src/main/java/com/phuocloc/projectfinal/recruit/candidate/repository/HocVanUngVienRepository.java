package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HocVanUngVien;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HocVanUngVienRepository extends JpaRepository<HocVanUngVien, Integer> {
    List<HocVanUngVien> findByHoSoUngVien_IdOrderByThoiGianBatDauDesc(Integer hoSoUngVienId);

    List<HocVanUngVien> findByTrangThaiOrderByIdDesc(String trangThai);
}

package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.KyNangUngVien;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.KyNangUngVienId;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KyNangUngVienRepository extends JpaRepository<KyNangUngVien, KyNangUngVienId> {
    List<KyNangUngVien> findByHoSoUngVien_Id(Integer hoSoUngVienId);
    void deleteByHoSoUngVien_Id(Integer hoSoUngVienId);
}

package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.NganhNgheUngVien;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.NganhNgheUngVienId;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NganhNgheUngVienRepository extends JpaRepository<NganhNgheUngVien, NganhNgheUngVienId> {

    List<NganhNgheUngVien> findByHoSoUngVien_Id(Integer hoSoUngVienId);

    void deleteByHoSoUngVien_Id(Integer hoSoUngVienId);
}

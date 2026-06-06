package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.NganhNgheUngVien;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.NganhNgheUngVienId;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

/**
 * Repository truy cập dữ liệu cho NganhNgheUngVienRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface NganhNgheUngVienRepository extends JpaRepository<NganhNgheUngVien, NganhNgheUngVienId> {

    @Query("SELECT n FROM NganhNgheUngVien n WHERE n.hoSoUngVien.id = :hoSoUngVienId")
    List<NganhNgheUngVien> findByHoSoUngVien_Id(Integer hoSoUngVienId);

    @Modifying
    @Transactional
    @Query("DELETE FROM NganhNgheUngVien n WHERE n.hoSoUngVien.id = :hoSoUngVienId")
    void deleteByHoSoUngVien_Id(Integer hoSoUngVienId);
}

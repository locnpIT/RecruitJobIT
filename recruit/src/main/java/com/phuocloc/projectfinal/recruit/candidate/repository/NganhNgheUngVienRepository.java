package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.NganhNgheUngVien;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.NganhNgheUngVienId;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository truy cập dữ liệu cho NganhNgheUngVienRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface NganhNgheUngVienRepository extends JpaRepository<NganhNgheUngVien, NganhNgheUngVienId> {

    List<NganhNgheUngVien> findByHoSoUngVien_Id(Integer hoSoUngVienId);

    void deleteByHoSoUngVien_Id(Integer hoSoUngVienId);
}

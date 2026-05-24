package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.KyNangUngVien;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.KyNangUngVienId;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository truy cập dữ liệu cho KyNangUngVienRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface KyNangUngVienRepository extends JpaRepository<KyNangUngVien, KyNangUngVienId> {
    List<KyNangUngVien> findByHoSoUngVien_Id(Integer hoSoUngVienId);

    boolean existsByHoSoUngVien_IdAndKyNang_Id(Integer hoSoUngVienId, Integer kyNangId);

    void deleteByHoSoUngVien_Id(Integer hoSoUngVienId);
}

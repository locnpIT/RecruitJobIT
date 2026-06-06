package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.KyNangUngVien;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.KyNangUngVienId;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

/**
 * Repository truy cập dữ liệu cho KyNangUngVienRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface KyNangUngVienRepository extends JpaRepository<KyNangUngVien, KyNangUngVienId> {
    @Query("SELECT k FROM KyNangUngVien k WHERE k.hoSoUngVien.id = :hoSoUngVienId")
    List<KyNangUngVien> findByHoSoUngVien_Id(Integer hoSoUngVienId);

    @Query("""
            SELECT CASE WHEN COUNT(k) > 0 THEN TRUE ELSE FALSE END
            FROM KyNangUngVien k
            WHERE k.hoSoUngVien.id = :hoSoUngVienId
              AND k.kyNang.id = :kyNangId
            """)
    boolean existsByHoSoUngVien_IdAndKyNang_Id(Integer hoSoUngVienId, Integer kyNangId);

    @Modifying
    @Transactional
    @Query("DELETE FROM KyNangUngVien k WHERE k.hoSoUngVien.id = :hoSoUngVienId")
    void deleteByHoSoUngVien_Id(Integer hoSoUngVienId);
}

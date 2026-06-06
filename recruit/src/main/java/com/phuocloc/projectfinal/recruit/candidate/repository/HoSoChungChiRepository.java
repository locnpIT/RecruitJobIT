package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoChungChi;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoChungChiId;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

public interface HoSoChungChiRepository extends JpaRepository<HoSoChungChi, HoSoChungChiId> {

    @Query("SELECT h FROM HoSoChungChi h LEFT JOIN h.chungChi c WHERE h.hoSoUngVien.id = :hoSoUngVienId ORDER BY c.ngayBatDau desc")
    List<HoSoChungChi> findByHoSoUngVien_IdOrderByChungChi_NgayBatDauDesc(Integer hoSoUngVienId);

    @Query("SELECT h FROM HoSoChungChi h WHERE h.hoSoUngVien.id = :hoSoUngVienId")
    List<HoSoChungChi> findByHoSoUngVien_Id(Integer hoSoUngVienId);

    @Query("""
            SELECT CASE WHEN COUNT(h) > 0 THEN TRUE ELSE FALSE END
            FROM HoSoChungChi h
            WHERE h.hoSoUngVien.id = :hoSoUngVienId
              AND h.chungChi.id = :chungChiId
            """)
    boolean existsByHoSoUngVien_IdAndChungChi_Id(Integer hoSoUngVienId, Integer chungChiId);

    @Modifying
    @Transactional
    @Query("""
            DELETE FROM HoSoChungChi h
            WHERE h.hoSoUngVien.id = :hoSoUngVienId
              AND h.chungChi.id = :chungChiId
            """)
    void deleteByHoSoUngVien_IdAndChungChi_Id(Integer hoSoUngVienId, Integer chungChiId);

    @Modifying
    @Transactional
    @Query("""
            DELETE FROM HoSoChungChi h
            WHERE h.chungChi.id = :chungChiId
            """)
    void deleteByChungChi_Id(Integer chungChiId);
}

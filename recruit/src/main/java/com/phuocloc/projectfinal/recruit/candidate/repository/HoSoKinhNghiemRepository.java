package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoKinhNghiem;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoKinhNghiemId;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

public interface HoSoKinhNghiemRepository extends JpaRepository<HoSoKinhNghiem, HoSoKinhNghiemId> {

    @Query("SELECT h FROM HoSoKinhNghiem h LEFT JOIN h.kinhNghiem k WHERE h.hoSoUngVien.id = :hoSoUngVienId ORDER BY k.thoiGianBatDau desc")
    List<HoSoKinhNghiem> findByHoSoUngVien_IdOrderByKinhNghiem_ThoiGianBatDauDesc(Integer hoSoUngVienId);

    @Query("SELECT h FROM HoSoKinhNghiem h WHERE h.hoSoUngVien.id = :hoSoUngVienId")
    List<HoSoKinhNghiem> findByHoSoUngVien_Id(Integer hoSoUngVienId);

    @Query("""
            SELECT CASE WHEN COUNT(h) > 0 THEN TRUE ELSE FALSE END
            FROM HoSoKinhNghiem h
            WHERE h.hoSoUngVien.id = :hoSoUngVienId
              AND h.kinhNghiem.id = :kinhNghiemId
            """)
    boolean existsByHoSoUngVien_IdAndKinhNghiem_Id(Integer hoSoUngVienId, Integer kinhNghiemId);

    @Modifying
    @Transactional
    @Query("""
            DELETE FROM HoSoKinhNghiem h
            WHERE h.hoSoUngVien.id = :hoSoUngVienId
              AND h.kinhNghiem.id = :kinhNghiemId
            """)
    void deleteByHoSoUngVien_IdAndKinhNghiem_Id(Integer hoSoUngVienId, Integer kinhNghiemId);

    @Modifying
    @Transactional
    @Query("""
            DELETE FROM HoSoKinhNghiem h
            WHERE h.kinhNghiem.id = :kinhNghiemId
            """)
    void deleteByKinhNghiem_Id(Integer kinhNghiemId);
}

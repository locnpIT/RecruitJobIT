package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoHocVan;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoHocVanId;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

public interface HoSoHocVanRepository extends JpaRepository<HoSoHocVan, HoSoHocVanId> {

    @Query("SELECT h FROM HoSoHocVan h LEFT JOIN h.hocVan h_0 WHERE h.hoSoUngVien.id = :hoSoUngVienId ORDER BY h_0.thoiGianBatDau desc")
    List<HoSoHocVan> findByHoSoUngVien_IdOrderByHocVan_ThoiGianBatDauDesc(Integer hoSoUngVienId);

    @Query("SELECT h FROM HoSoHocVan h WHERE h.hoSoUngVien.id = :hoSoUngVienId")
    List<HoSoHocVan> findByHoSoUngVien_Id(Integer hoSoUngVienId);

    @Query("""
            SELECT CASE WHEN COUNT(h) > 0 THEN TRUE ELSE FALSE END
            FROM HoSoHocVan h
            WHERE h.hoSoUngVien.id = :hoSoUngVienId
              AND h.hocVan.id = :hocVanId
            """)
    boolean existsByHoSoUngVien_IdAndHocVan_Id(Integer hoSoUngVienId, Integer hocVanId);

    @Modifying
    @Transactional
    @Query("""
            DELETE FROM HoSoHocVan h
            WHERE h.hoSoUngVien.id = :hoSoUngVienId
              AND h.hocVan.id = :hocVanId
            """)
    void deleteByHoSoUngVien_IdAndHocVan_Id(Integer hoSoUngVienId, Integer hocVanId);

    @Modifying
    @Transactional
    @Query("""
            DELETE FROM HoSoHocVan h
            WHERE h.hocVan.id = :hocVanId
            """)
    void deleteByHocVan_Id(Integer hocVanId);
}

package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoHocVan;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoHocVanId;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HoSoHocVanRepository extends JpaRepository<HoSoHocVan, HoSoHocVanId> {

    List<HoSoHocVan> findByHoSoUngVien_IdOrderByHocVan_ThoiGianBatDauDesc(Integer hoSoUngVienId);

    List<HoSoHocVan> findByHoSoUngVien_Id(Integer hoSoUngVienId);

    boolean existsByHoSoUngVien_IdAndHocVan_Id(Integer hoSoUngVienId, Integer hocVanId);

    void deleteByHoSoUngVien_IdAndHocVan_Id(Integer hoSoUngVienId, Integer hocVanId);

    void deleteByHocVan_Id(Integer hocVanId);
}


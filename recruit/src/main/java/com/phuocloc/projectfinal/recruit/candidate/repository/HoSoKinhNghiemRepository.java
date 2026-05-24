package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoKinhNghiem;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoKinhNghiemId;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HoSoKinhNghiemRepository extends JpaRepository<HoSoKinhNghiem, HoSoKinhNghiemId> {

    List<HoSoKinhNghiem> findByHoSoUngVien_IdOrderByKinhNghiem_ThoiGianBatDauDesc(Integer hoSoUngVienId);

    List<HoSoKinhNghiem> findByHoSoUngVien_Id(Integer hoSoUngVienId);

    boolean existsByHoSoUngVien_IdAndKinhNghiem_Id(Integer hoSoUngVienId, Integer kinhNghiemId);

    void deleteByHoSoUngVien_IdAndKinhNghiem_Id(Integer hoSoUngVienId, Integer kinhNghiemId);

    void deleteByKinhNghiem_Id(Integer kinhNghiemId);
}


package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoChungChi;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoChungChiId;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HoSoChungChiRepository extends JpaRepository<HoSoChungChi, HoSoChungChiId> {

    List<HoSoChungChi> findByHoSoUngVien_IdOrderByChungChi_NgayBatDauDesc(Integer hoSoUngVienId);

    List<HoSoChungChi> findByHoSoUngVien_Id(Integer hoSoUngVienId);

    boolean existsByHoSoUngVien_IdAndChungChi_Id(Integer hoSoUngVienId, Integer chungChiId);

    void deleteByHoSoUngVien_IdAndChungChi_Id(Integer hoSoUngVienId, Integer chungChiId);

    void deleteByChungChi_Id(Integer chungChiId);
}


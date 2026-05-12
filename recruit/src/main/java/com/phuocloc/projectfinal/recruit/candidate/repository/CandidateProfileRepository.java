package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoUngVien;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CandidateProfileRepository extends JpaRepository<HoSoUngVien, Integer> {

    Optional<HoSoUngVien> findByNguoiDung_Id(Integer nguoiDungId);
    List<HoSoUngVien> findAllByNguoiDung_IdOrderByNgayCapNhatDesc(Integer nguoiDungId);
    Optional<HoSoUngVien> findByIdAndNguoiDung_Id(Integer id, Integer nguoiDungId);

    boolean existsByNguoiDung_Id(Integer nguoiDungId);
}

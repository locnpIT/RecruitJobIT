package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoUngVien;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository truy cập dữ liệu cho CandidateProfileRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface CandidateProfileRepository extends JpaRepository<HoSoUngVien, Integer> {

    Optional<HoSoUngVien> findFirstByNguoiDung_IdOrderByNgayCapNhatDesc(Integer nguoiDungId);
    List<HoSoUngVien> findAllByNguoiDung_IdOrderByNgayCapNhatDesc(Integer nguoiDungId);
    List<HoSoUngVien> findByIdInAndNgayXoaIsNull(List<Integer> ids);
    Optional<HoSoUngVien> findByIdAndNguoiDung_Id(Integer id, Integer nguoiDungId);

    boolean existsByNguoiDung_Id(Integer nguoiDungId);
}

package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoUngVien;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/**
 * Repository truy cập dữ liệu cho CandidateProfileRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface CandidateProfileRepository extends JpaRepository<HoSoUngVien, Integer> {

    @Query("SELECT h FROM HoSoUngVien h WHERE h.nguoiDung.id = :nguoiDungId ORDER BY h.ngayCapNhat desc")
    Optional<HoSoUngVien> findFirstByNguoiDung_IdOrderByNgayCapNhatDesc(Integer nguoiDungId);

    @Query("SELECT h FROM HoSoUngVien h WHERE h.nguoiDung.id = :nguoiDungId ORDER BY h.ngayCapNhat desc")
    List<HoSoUngVien> findAllByNguoiDung_IdOrderByNgayCapNhatDesc(Integer nguoiDungId);

    @Query("SELECT h FROM HoSoUngVien h WHERE h.id IN :ids AND h.ngayXoa IS NULL")
    List<HoSoUngVien> findByIdInAndNgayXoaIsNull(List<Integer> ids);

    @Query("SELECT h FROM HoSoUngVien h WHERE h.id = :id AND h.nguoiDung.id = :nguoiDungId")
    Optional<HoSoUngVien> findByIdAndNguoiDung_Id(Integer id, Integer nguoiDungId);

    @Query("""
            SELECT CASE WHEN COUNT(h) > 0 THEN TRUE ELSE FALSE END
            FROM HoSoUngVien h
            WHERE h.nguoiDung.id = :nguoiDungId
            """)
    boolean existsByNguoiDung_Id(Integer nguoiDungId);
}

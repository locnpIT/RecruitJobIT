package com.phuocloc.projectfinal.recruit.domain.tuyendung.repository;

import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.DonUngTuyen;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/**
 * Repository truy cập dữ liệu cho DonUngTuyenRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface DonUngTuyenRepository extends JpaRepository<DonUngTuyen, Integer> {

    @Query("""
            SELECT DISTINCT d FROM DonUngTuyen d
            LEFT JOIN d.tinTuyenDung t
            LEFT JOIN t.chiNhanhs c
            WHERE c.id = :chiNhanhId
              AND d.ngayXoa IS NULL
            ORDER BY d.ngayTao desc
            """)
    List<DonUngTuyen> findByTinTuyenDung_ChiNhanhs_IdAndNgayXoaIsNullOrderByNgayTaoDesc(Integer chiNhanhId);

    @Query("SELECT d FROM DonUngTuyen d WHERE d.tinTuyenDung.id = :tinTuyenDungId AND d.ngayXoa IS NULL ORDER BY d.ngayTao desc")
    List<DonUngTuyen> findByTinTuyenDung_IdAndNgayXoaIsNullOrderByNgayTaoDesc(Integer tinTuyenDungId);

    @Query("SELECT d FROM DonUngTuyen d WHERE d.id = :id AND d.ngayXoa IS NULL")
    Optional<DonUngTuyen> findByIdAndNgayXoaIsNull(Integer id);

    @Query("""
            SELECT CASE WHEN COUNT(d) > 0 THEN TRUE ELSE FALSE END
            FROM DonUngTuyen d
            WHERE d.tinTuyenDung.id = :tinTuyenDungId
              AND d.hoSoUngVien.nguoiDung.id = :nguoiDungId
              AND d.ngayXoa IS NULL
            """)
    boolean existsByTinTuyenDung_IdAndHoSoUngVien_NguoiDung_IdAndNgayXoaIsNull(Integer tinTuyenDungId, Integer nguoiDungId);

    @Query("SELECT d FROM DonUngTuyen d LEFT JOIN d.hoSoUngVien h LEFT JOIN h.nguoiDung n WHERE d.tinTuyenDung.id = :tinTuyenDungId AND n.id = :nguoiDungId AND d.ngayXoa IS NULL")
    Optional<DonUngTuyen> findByTinTuyenDung_IdAndHoSoUngVien_NguoiDung_IdAndNgayXoaIsNull(Integer tinTuyenDungId, Integer nguoiDungId);

    @Query("SELECT d FROM DonUngTuyen d LEFT JOIN d.hoSoUngVien h LEFT JOIN h.nguoiDung n WHERE n.id = :nguoiDungId AND d.ngayXoa IS NULL ORDER BY d.ngayTao desc")
    List<DonUngTuyen> findByHoSoUngVien_NguoiDung_IdAndNgayXoaIsNullOrderByNgayTaoDesc(Integer nguoiDungId);
}

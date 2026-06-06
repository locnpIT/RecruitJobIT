package com.phuocloc.projectfinal.recruit.domain.tuyendung.repository;

import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.NguoiDungTinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.NguoiDungTinTuyenDungId;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/**
 * Repository truy cập dữ liệu cho NguoiDungTinTuyenDungRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface NguoiDungTinTuyenDungRepository extends JpaRepository<NguoiDungTinTuyenDung, NguoiDungTinTuyenDungId> {

    @Query("""
            SELECT CASE WHEN COUNT(n) > 0 THEN TRUE ELSE FALSE END
            FROM NguoiDungTinTuyenDung n
            WHERE n.nguoiDung.id = :nguoiDungId
              AND n.tinTuyenDung.id = :tinTuyenDungId
            """)
    boolean existsByNguoiDung_IdAndTinTuyenDung_Id(Integer nguoiDungId, Integer tinTuyenDungId);

    @Query("SELECT n FROM NguoiDungTinTuyenDung n WHERE n.nguoiDung.id = :nguoiDungId AND n.tinTuyenDung.id = :tinTuyenDungId")
    Optional<NguoiDungTinTuyenDung> findByNguoiDung_IdAndTinTuyenDung_Id(Integer nguoiDungId, Integer tinTuyenDungId);

    @EntityGraph(attributePaths = {
            "tinTuyenDung",
            "tinTuyenDung.chiNhanh",
            "tinTuyenDung.chiNhanh.congTy",
            "tinTuyenDung.chiNhanh.xaPhuong",
            "tinTuyenDung.chiNhanh.xaPhuong.tinhThanh",
            "tinTuyenDung.nganhNghe",
            "tinTuyenDung.loaiHinhLamViec",
            "tinTuyenDung.capDoKinhNghiem"
    })
    @Query("SELECT n FROM NguoiDungTinTuyenDung n WHERE n.nguoiDung.id = :nguoiDungId ORDER BY n.ngayTao desc")
    List<NguoiDungTinTuyenDung> findByNguoiDung_IdOrderByNgayTaoDesc(Integer nguoiDungId);
}

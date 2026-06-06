package com.phuocloc.projectfinal.recruit.auth.repository;

import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/**
 * Repository truy cập dữ liệu cho UsersRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface UsersRepository extends JpaRepository<NguoiDung, Integer> {

    @EntityGraph(attributePaths = {"vaiTroHeThong", "xaPhuong"})
    @Query("SELECT n FROM NguoiDung n WHERE n.email = :email")
    Optional<NguoiDung> findByEmail(String email);

    @EntityGraph(attributePaths = {"vaiTroHeThong", "xaPhuong", "xaPhuong.tinhThanh"})
    @Query("SELECT n FROM NguoiDung n WHERE n.id = :id")
    Optional<NguoiDung> findDetailedById(Integer id);

    @Query("""
            SELECT CASE WHEN COUNT(n) > 0 THEN TRUE ELSE FALSE END
            FROM NguoiDung n
            WHERE n.email = :email
            """)
    boolean existsByEmail(String email);

    @Query("SELECT n FROM NguoiDung n WHERE n.vaiTroHeThong.id = :roleId")
    List<NguoiDung> findByVaiTroHeThong_Id(Integer roleId);

    @Query("SELECT COUNT(n) FROM NguoiDung n WHERE n.ngayXoa IS NULL")
    long countByNgayXoaIsNull();

    @Query("SELECT COUNT(n) FROM NguoiDung n WHERE n.ngayXoa IS NULL AND n.dangHoatDong = TRUE")
    long countByNgayXoaIsNullAndDangHoatDongTrue();

    @Query("SELECT COUNT(n) FROM NguoiDung n WHERE n.ngayXoa IS NULL AND n.dangHoatDong = FALSE")
    long countByNgayXoaIsNullAndDangHoatDongFalse();

    @Query("SELECT COUNT(u) FROM NguoiDung u WHERE u.ngayXoa IS NULL AND u.vaiTroHeThong.ten = :roleName")
    long countActiveBySystemRole(String roleName);
}

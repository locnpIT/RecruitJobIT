package com.phuocloc.projectfinal.recruit.auth.repository;

import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UsersRepository extends JpaRepository<NguoiDung, Integer> {

    @EntityGraph(attributePaths = {"vaiTroHeThong", "xaPhuong"})
    Optional<NguoiDung> findByEmail(String email);

    boolean existsByEmail(String email);

    List<NguoiDung> findByVaiTroHeThong_Id(Integer roleId);

    long countByNgayXoaIsNull();

    long countByNgayXoaIsNullAndDangHoatDongTrue();

    long countByNgayXoaIsNullAndDangHoatDongFalse();

    @Query("SELECT COUNT(u) FROM NguoiDung u WHERE u.ngayXoa IS NULL AND u.vaiTroHeThong.ten = :roleName")
    long countActiveBySystemRole(String roleName);
}

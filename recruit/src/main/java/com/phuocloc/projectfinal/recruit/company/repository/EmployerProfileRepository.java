package com.phuocloc.projectfinal.recruit.company.repository;

import com.phuocloc.projectfinal.recruit.domain.congty.entity.ThanhVienCongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ThanhVienCongTyId;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/**
 * Repository truy cập dữ liệu cho EmployerProfileRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface EmployerProfileRepository extends JpaRepository<ThanhVienCongTy, ThanhVienCongTyId> {

    Optional<ThanhVienCongTy> findFirstByNguoiDung_IdAndVaiTroCongTy_TenIgnoreCase(Integer nguoiDungId, String vaiTro);

    @Query("""
            SELECT t FROM ThanhVienCongTy t
            WHERE t.nguoiDung.id = :nguoiDungId
              AND t.ngayXoa IS NULL
            """)
    List<ThanhVienCongTy> findByNguoiDung_IdAndNgayXoaIsNull(Integer nguoiDungId);

    @Query("""
            SELECT t FROM ThanhVienCongTy t
            WHERE t.nguoiDung.id = :nguoiDungId
              AND t.chiNhanh.id = :chiNhanhId
              AND t.ngayXoa IS NULL
            """)
    Optional<ThanhVienCongTy> findByNguoiDung_IdAndChiNhanh_IdAndNgayXoaIsNull(Integer nguoiDungId, Integer chiNhanhId);

    @Query("SELECT t FROM ThanhVienCongTy t WHERE t.chiNhanh.congTy.id = :congTyId")
    List<ThanhVienCongTy> findByChiNhanh_CongTy_Id(Integer congTyId);

    @Query("""
            SELECT t FROM ThanhVienCongTy t
            WHERE t.chiNhanh.congTy.id = :congTyId
              AND t.nguoiDung.dangHoatDong = TRUE
            """)
    List<ThanhVienCongTy> findByChiNhanh_CongTy_IdAndNguoiDung_DangHoatDongTrue(Integer congTyId);
}

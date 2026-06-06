package com.phuocloc.projectfinal.recruit.company.repository;

import com.phuocloc.projectfinal.recruit.domain.congty.entity.DangKyGoiCongTy;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/**
 * Repository truy cập dữ liệu cho DangKyGoiCongTyRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface DangKyGoiCongTyRepository extends JpaRepository<DangKyGoiCongTy, Integer> {

    @Query("""
            SELECT d FROM DangKyGoiCongTy d
            WHERE d.congTy.id = :congTyId
            ORDER BY d.ngayTao DESC
            """)
    List<DangKyGoiCongTy> findByCongTy_IdOrderByNgayTaoDesc(Integer congTyId);

    List<DangKyGoiCongTy> findTop10ByOrderByNgayTaoDesc();

    @Query("SELECT COUNT(d) FROM DangKyGoiCongTy d WHERE d.danhMucGoi.id = :danhMucGoiId")
    long countByDanhMucGoi_Id(Integer danhMucGoiId);
}

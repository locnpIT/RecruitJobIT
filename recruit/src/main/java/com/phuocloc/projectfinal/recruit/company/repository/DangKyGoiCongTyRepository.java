package com.phuocloc.projectfinal.recruit.company.repository;

import com.phuocloc.projectfinal.recruit.domain.congty.entity.DangKyGoiCongTy;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository truy cập dữ liệu cho DangKyGoiCongTyRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface DangKyGoiCongTyRepository extends JpaRepository<DangKyGoiCongTy, Integer> {

    List<DangKyGoiCongTy> findByCongTy_IdOrderByNgayTaoDesc(Integer congTyId);

    List<DangKyGoiCongTy> findTop10ByOrderByNgayTaoDesc();

    long countByDanhMucGoi_Id(Integer danhMucGoiId);
}

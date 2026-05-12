package com.phuocloc.projectfinal.recruit.company.repository;

import com.phuocloc.projectfinal.recruit.domain.congty.entity.DangKyGoiCongTy;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DangKyGoiCongTyRepository extends JpaRepository<DangKyGoiCongTy, Integer> {

    List<DangKyGoiCongTy> findByCongTy_IdOrderByNgayTaoDesc(Integer congTyId);

    List<DangKyGoiCongTy> findTop10ByOrderByNgayTaoDesc();

    long countByDanhMucGoi_Id(Integer danhMucGoiId);
}

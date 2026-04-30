package com.phuocloc.projectfinal.recruit.company.repository;

import com.phuocloc.projectfinal.recruit.domain.congty.entity.ThanhVienCongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ThanhVienCongTyId;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployerProfileRepository extends JpaRepository<ThanhVienCongTy, ThanhVienCongTyId> {

    Optional<ThanhVienCongTy> findFirstByNguoiDung_IdAndVaiTroCongTy_TenIgnoreCase(Integer nguoiDungId, String vaiTro);

    List<ThanhVienCongTy> findByChiNhanh_CongTy_Id(Integer congTyId);

    List<ThanhVienCongTy> findByChiNhanh_CongTy_IdAndNguoiDung_DangHoatDongTrue(Integer congTyId);
}

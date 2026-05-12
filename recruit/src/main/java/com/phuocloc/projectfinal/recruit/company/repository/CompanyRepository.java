package com.phuocloc.projectfinal.recruit.company.repository;

import com.phuocloc.projectfinal.recruit.domain.congty.entity.CongTy;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface CompanyRepository extends JpaRepository<CongTy, Integer>, JpaSpecificationExecutor<CongTy> {

    Optional<CongTy> findByMaSoThue(String maSoThue);

    boolean existsByMaSoThue(String maSoThue);

    List<CongTy> findByTrangThai(String trangThai);

    long countByNgayXoaIsNull();

    long countByNgayXoaIsNullAndTrangThai(String trangThai);

    @Query("SELECT COUNT(c) FROM CongTy c WHERE c.ngayXoa IS NULL AND LOWER(c.trangThai) IN :statuses")
    long countByNgayXoaIsNullAndTrangThaiIn(List<String> statuses);
}

package com.phuocloc.projectfinal.recruit.company.repository;

import com.phuocloc.projectfinal.recruit.domain.congty.entity.TepMinhChungCongTy;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyProofDocumentRepository extends JpaRepository<TepMinhChungCongTy, Integer> {

    List<TepMinhChungCongTy> findByCongTy_IdOrderByNgayTaoDesc(Integer congTyId);

    List<TepMinhChungCongTy> findByCongTy_IdAndTrangThaiOrderByNgayTaoDesc(Integer congTyId, String trangThai);
}

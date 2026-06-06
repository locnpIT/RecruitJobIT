package com.phuocloc.projectfinal.recruit.company.repository;

import com.phuocloc.projectfinal.recruit.domain.congty.entity.TepMinhChungCongTy;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/**
 * Repository truy cập dữ liệu cho CompanyProofDocumentRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface CompanyProofDocumentRepository extends JpaRepository<TepMinhChungCongTy, Integer> {

    @Query("""
            SELECT t FROM TepMinhChungCongTy t
            WHERE t.congTy.id = :congTyId
            ORDER BY t.ngayTao DESC
            """)
    List<TepMinhChungCongTy> findByCongTy_IdOrderByNgayTaoDesc(Integer congTyId);

    @Query("""
            SELECT t FROM TepMinhChungCongTy t
            WHERE t.congTy.id = :congTyId
              AND t.trangThai = :trangThai
            ORDER BY t.ngayTao DESC
            """)
    List<TepMinhChungCongTy> findByCongTy_IdAndTrangThaiOrderByNgayTaoDesc(Integer congTyId, String trangThai);
}

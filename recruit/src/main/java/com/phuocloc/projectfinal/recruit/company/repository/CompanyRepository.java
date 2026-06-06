package com.phuocloc.projectfinal.recruit.company.repository;

import com.phuocloc.projectfinal.recruit.domain.congty.entity.CongTy;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

/**
 * Repository truy cập dữ liệu cho CompanyRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface CompanyRepository extends JpaRepository<CongTy, Integer>, JpaSpecificationExecutor<CongTy> {

    @Query("SELECT c FROM CongTy c WHERE c.maSoThue = :maSoThue")
    Optional<CongTy> findByMaSoThue(String maSoThue);

    @Query("""
            SELECT CASE WHEN COUNT(c) > 0 THEN TRUE ELSE FALSE END
            FROM CongTy c
            WHERE c.maSoThue = :maSoThue
            """)
    boolean existsByMaSoThue(String maSoThue);

    @Query("SELECT c FROM CongTy c WHERE c.trangThai = :trangThai")
    List<CongTy> findByTrangThai(String trangThai);

    @Query("SELECT COUNT(c) FROM CongTy c WHERE c.ngayXoa IS NULL")
    long countByNgayXoaIsNull();

    @Query("""
            SELECT COUNT(c) FROM CongTy c
            WHERE c.ngayXoa IS NULL
              AND c.trangThai = :trangThai
            """)
    long countByNgayXoaIsNullAndTrangThai(String trangThai);

    @Query("SELECT COUNT(c) FROM CongTy c WHERE c.ngayXoa IS NULL AND LOWER(c.trangThai) IN :statuses")
    long countByNgayXoaIsNullAndTrangThaiIn(List<String> statuses);

    @Query("""
            SELECT c FROM CongTy c
            WHERE c.id = :id
              AND c.ngayXoa IS NULL
              AND UPPER(c.trangThai) = UPPER(:trangThai)
            """)
    Optional<CongTy> findByIdAndNgayXoaIsNullAndTrangThaiIgnoreCase(Integer id, String trangThai);
}

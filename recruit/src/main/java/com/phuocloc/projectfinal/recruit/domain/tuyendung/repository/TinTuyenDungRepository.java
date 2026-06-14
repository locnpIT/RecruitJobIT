package com.phuocloc.projectfinal.recruit.domain.tuyendung.repository;

import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Repository truy cập dữ liệu cho TinTuyenDungRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface TinTuyenDungRepository extends JpaRepository<TinTuyenDung, Integer> {

    @Query("""
            SELECT DISTINCT t FROM TinTuyenDung t
            JOIN t.chiNhanhs cn
            LEFT JOIN FETCH t.chiNhanhs fetchedBranches
            LEFT JOIN FETCH fetchedBranches.congTy fetchedCompany
            LEFT JOIN FETCH t.loaiHinhLamViec legacyWorkType
            LEFT JOIN FETCH t.loaiHinhLamViecs workTypes
            LEFT JOIN FETCH t.nganhNghe industry
            LEFT JOIN FETCH t.capDoKinhNghiem experienceLevel
            WHERE cn.id = :chiNhanhId
              AND t.ngayXoa IS NULL
            ORDER BY t.ngayTao desc
            """)
    List<TinTuyenDung> findByChiNhanhs_IdAndNgayXoaIsNullOrderByNgayTaoDesc(Integer chiNhanhId);

    @Query("""
            SELECT DISTINCT t FROM TinTuyenDung t
            JOIN t.chiNhanhs cn
            WHERE t.id = :id
              AND cn.id = :chiNhanhId
              AND t.ngayXoa IS NULL
            """)
    Optional<TinTuyenDung> findByIdAndChiNhanhs_IdAndNgayXoaIsNull(Integer id, Integer chiNhanhId);

    @Query("SELECT t FROM TinTuyenDung t WHERE t.ngayXoa IS NULL")
    List<TinTuyenDung> findByNgayXoaIsNull(Sort sort);

    @Query("""
            SELECT COUNT(t.id) > 0 FROM TinTuyenDung t
            WHERE EXISTS (
                SELECT 1 FROM t.chiNhanhs cn
                WHERE cn.id = :chiNhanhId
            )
              AND t.ngayXoa IS NULL
            """)
    boolean existsByChiNhanhs_IdAndNgayXoaIsNull(Integer chiNhanhId);

    @Query("""
            SELECT DISTINCT t FROM TinTuyenDung t
            LEFT JOIN FETCH t.chiNhanhs cn
            LEFT JOIN FETCH cn.congTy ct
            LEFT JOIN FETCH cn.xaPhuong xp
            LEFT JOIN FETCH xp.tinhThanh tt
            LEFT JOIN FETCH t.nganhNghe nn
            LEFT JOIN FETCH t.loaiHinhLamViec lh
            LEFT JOIN FETCH t.loaiHinhLamViecs lhs
            LEFT JOIN FETCH t.capDoKinhNghiem cd
            WHERE t.ngayXoa IS NULL
              AND UPPER(t.trangThai) = 'APPROVED'
              AND (t.denHanLuc IS NULL OR t.denHanLuc >= :now)
              AND ct.ngayXoa IS NULL
              AND UPPER(ct.trangThai) = 'APPROVED'
            ORDER BY t.ngayTao DESC
            """)
    List<TinTuyenDung> findPublicApprovedActiveJobs(LocalDateTime now);

    @Query("""
            SELECT DISTINCT t FROM TinTuyenDung t
            LEFT JOIN FETCH t.chiNhanhs cn
            LEFT JOIN FETCH cn.congTy ct
            LEFT JOIN FETCH cn.xaPhuong xp
            LEFT JOIN FETCH xp.tinhThanh tt
            LEFT JOIN FETCH t.nganhNghe nn
            LEFT JOIN FETCH t.loaiHinhLamViec lh
            LEFT JOIN FETCH t.loaiHinhLamViecs lhs
            LEFT JOIN FETCH t.capDoKinhNghiem cd
            WHERE t.id = :id
              AND t.ngayXoa IS NULL
              AND UPPER(t.trangThai) = 'APPROVED'
              AND (t.denHanLuc IS NULL OR t.denHanLuc >= :now)
              AND ct.ngayXoa IS NULL
              AND UPPER(ct.trangThai) = 'APPROVED'
            """)
    Optional<TinTuyenDung> findPublicApprovedActiveJobById(Integer id, LocalDateTime now);

    @Query("""
            SELECT DISTINCT t FROM TinTuyenDung t
            LEFT JOIN FETCH t.chiNhanhs cn
            LEFT JOIN FETCH cn.congTy ct
            LEFT JOIN FETCH cn.xaPhuong xp
            LEFT JOIN FETCH xp.tinhThanh tt
            LEFT JOIN FETCH t.nganhNghe nn
            LEFT JOIN FETCH t.loaiHinhLamViec lh
            LEFT JOIN FETCH t.loaiHinhLamViecs lhs
            LEFT JOIN FETCH t.capDoKinhNghiem cd
            WHERE t.id IN :ids
              AND t.ngayXoa IS NULL
              AND UPPER(t.trangThai) = 'APPROVED'
              AND (t.denHanLuc IS NULL OR t.denHanLuc >= :now)
              AND ct.ngayXoa IS NULL
              AND UPPER(ct.trangThai) = 'APPROVED'
            """)
    List<TinTuyenDung> findPublicApprovedActiveJobsByIds(Collection<Integer> ids, LocalDateTime now);

    @Query("""
            SELECT t FROM TinTuyenDung t
            LEFT JOIN FETCH t.chiNhanhs cn
            LEFT JOIN FETCH cn.congTy ct
            LEFT JOIN FETCH cn.xaPhuong xp
            LEFT JOIN FETCH xp.tinhThanh tt
            LEFT JOIN FETCH t.nganhNghe nn
            LEFT JOIN FETCH t.loaiHinhLamViec lh
            LEFT JOIN FETCH t.loaiHinhLamViecs lhs
            LEFT JOIN FETCH t.capDoKinhNghiem cd
            WHERE ct.id = :companyId
              AND t.ngayXoa IS NULL
              AND UPPER(t.trangThai) = 'APPROVED'
              AND (t.denHanLuc IS NULL OR t.denHanLuc >= :now)
              AND ct.ngayXoa IS NULL
              AND UPPER(ct.trangThai) = 'APPROVED'
            ORDER BY t.ngayTao DESC
            """)
    List<TinTuyenDung> findPublicApprovedActiveJobsByCompanyId(Integer companyId, LocalDateTime now);

    @Query("""
            SELECT COUNT(DISTINCT t.id) FROM TinTuyenDung t
            JOIN t.chiNhanhs cn
            JOIN cn.congTy ct
            WHERE ct.id = :companyId
              AND t.ngayXoa IS NULL
              AND UPPER(t.trangThai) = 'APPROVED'
              AND (t.denHanLuc IS NULL OR t.denHanLuc >= :now)
              AND ct.ngayXoa IS NULL
              AND UPPER(ct.trangThai) = 'APPROVED'
            """)
    long countPublicApprovedActiveJobsByCompanyId(Integer companyId, LocalDateTime now);

    @Query("""
            SELECT ct.id AS companyId,
                   ct.ten AS companyName,
                   ct.logoUrl AS logoUrl,
                   COUNT(DISTINCT t.id) AS activeJobCount
            FROM TinTuyenDung t
            JOIN t.chiNhanhs cn
            JOIN cn.congTy ct
            WHERE t.ngayXoa IS NULL
              AND UPPER(t.trangThai) = 'APPROVED'
              AND (t.denHanLuc IS NULL OR t.denHanLuc >= :now)
              AND ct.ngayXoa IS NULL
              AND UPPER(ct.trangThai) = 'APPROVED'
              AND EXISTS (
                  SELECT 1
                  FROM DangKyGoiCongTy dk
                  WHERE dk.congTy = ct
                    AND UPPER(dk.trangThai) = 'ACTIVE'
                    AND UPPER(COALESCE(dk.trangThaiThanhToan, '')) IN ('PAID', 'SUCCESS', 'COMPLETED', 'DONE')
                    AND dk.batDauLuc IS NOT NULL
                    AND dk.hetHanLuc IS NOT NULL
                    AND :now >= dk.batDauLuc
                    AND :now <= dk.hetHanLuc
              )
            GROUP BY ct.id, ct.ten, ct.logoUrl
            ORDER BY COUNT(t.id) DESC, MAX(t.ngayCapNhat) DESC
            """)
    List<PublicTopCompanyProjection> findPublicTopCompaniesWithActivePackage(LocalDateTime now, Pageable pageable);

    @Query("""
            SELECT ct.ten
            FROM TinTuyenDung t
            JOIN t.chiNhanhs cn
            JOIN cn.congTy ct
            WHERE t.nguoiDang.id = :recruiterId
              AND t.ngayXoa IS NULL
              AND ct.ngayXoa IS NULL
            ORDER BY t.ngayTao DESC
            """)
    List<String> findCompanyNamesByRecruiterId(@Param("recruiterId") Integer recruiterId, Pageable pageable);
}

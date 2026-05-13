package com.phuocloc.projectfinal.recruit.domain.tuyendung.repository;

import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface TinTuyenDungRepository extends JpaRepository<TinTuyenDung, Integer> {

    @Query("SELECT t FROM TinTuyenDung t WHERE t.chiNhanh.id = :chiNhanhId AND t.ngayXoa IS NULL ORDER BY t.ngayTao desc")
    List<TinTuyenDung> findByChiNhanh_IdAndNgayXoaIsNullOrderByNgayTaoDesc(Integer chiNhanhId);

    @Query("SELECT t FROM TinTuyenDung t WHERE t.id = :id AND t.chiNhanh.id = :chiNhanhId AND t.ngayXoa IS NULL")
    Optional<TinTuyenDung> findByIdAndChiNhanh_IdAndNgayXoaIsNull(Integer id, Integer chiNhanhId);

    List<TinTuyenDung> findByNgayXoaIsNull(Sort sort);

    @Query("""
            SELECT t FROM TinTuyenDung t
            LEFT JOIN FETCH t.chiNhanh cn
            LEFT JOIN FETCH cn.congTy ct
            LEFT JOIN FETCH cn.xaPhuong xp
            LEFT JOIN FETCH xp.tinhThanh tt
            LEFT JOIN FETCH t.nganhNghe nn
            LEFT JOIN FETCH t.loaiHinhLamViec lh
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
            SELECT t FROM TinTuyenDung t
            LEFT JOIN FETCH t.chiNhanh cn
            LEFT JOIN FETCH cn.congTy ct
            LEFT JOIN FETCH cn.xaPhuong xp
            LEFT JOIN FETCH xp.tinhThanh tt
            LEFT JOIN FETCH t.nganhNghe nn
            LEFT JOIN FETCH t.loaiHinhLamViec lh
            LEFT JOIN FETCH t.capDoKinhNghiem cd
            WHERE t.id = :id
              AND t.ngayXoa IS NULL
              AND UPPER(t.trangThai) = 'APPROVED'
              AND (t.denHanLuc IS NULL OR t.denHanLuc >= :now)
              AND ct.ngayXoa IS NULL
              AND UPPER(ct.trangThai) = 'APPROVED'
            """)
    Optional<TinTuyenDung> findPublicApprovedActiveJobById(Integer id, LocalDateTime now);

    
}

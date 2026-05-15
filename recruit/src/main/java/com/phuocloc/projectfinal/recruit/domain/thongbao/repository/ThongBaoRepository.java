package com.phuocloc.projectfinal.recruit.domain.thongbao.repository;

import com.phuocloc.projectfinal.recruit.domain.thongbao.entity.ThongBao;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ThongBaoRepository extends JpaRepository<ThongBao, Integer> {

    Page<ThongBao> findByNguoiDung_IdAndNgayXoaIsNullOrderByNgayTaoDesc(Integer nguoiDungId, Pageable pageable);

    Optional<ThongBao> findByIdAndNguoiDung_IdAndNgayXoaIsNull(Integer id, Integer nguoiDungId);

    @Query("""
            SELECT COUNT(t.id)
            FROM ThongBao t
            WHERE t.nguoiDung.id = :nguoiDungId
              AND t.ngayXoa IS NULL
              AND (t.daDoc = false OR t.daDoc IS NULL)
            """)
    long countUnreadByNguoiDungId(@Param("nguoiDungId") Integer nguoiDungId);

    @Query("""
            SELECT t
            FROM ThongBao t
            WHERE t.nguoiDung.id = :nguoiDungId
              AND t.ngayXoa IS NULL
              AND (t.daDoc = false OR t.daDoc IS NULL)
            ORDER BY t.ngayTao DESC
            """)
    List<ThongBao> findUnreadByNguoiDungId(@Param("nguoiDungId") Integer nguoiDungId);
}

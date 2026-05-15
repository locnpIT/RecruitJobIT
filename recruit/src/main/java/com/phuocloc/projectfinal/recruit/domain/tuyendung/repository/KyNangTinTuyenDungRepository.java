package com.phuocloc.projectfinal.recruit.domain.tuyendung.repository;

import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.KyNangTinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.KyNangTinTuyenDungId;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface KyNangTinTuyenDungRepository extends JpaRepository<KyNangTinTuyenDung, KyNangTinTuyenDungId> {

    @Query("""
            SELECT link
            FROM KyNangTinTuyenDung link
            LEFT JOIN FETCH link.kyNang skill
            WHERE link.tinTuyenDung.id = :jobId
            ORDER BY skill.ten ASC
            """)
    List<KyNangTinTuyenDung> findByTinTuyenDungIdOrderByKyNangTenAsc(@Param("jobId") Integer jobId);

    @Query("""
            SELECT link
            FROM KyNangTinTuyenDung link
            LEFT JOIN FETCH link.kyNang skill
            WHERE link.tinTuyenDung.id IN :jobIds
            ORDER BY link.tinTuyenDung.id ASC, skill.ten ASC
            """)
    List<KyNangTinTuyenDung> findByTinTuyenDungIdsOrderByKyNangTenAsc(@Param("jobIds") Collection<Integer> jobIds);

    void deleteByTinTuyenDung_Id(Integer jobId);
}

package com.phuocloc.projectfinal.recruit.domain.tuyendung.repository;

import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
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

    
}

package com.phuocloc.projectfinal.recruit.domain.diadiem.repository;

import com.phuocloc.projectfinal.recruit.domain.diadiem.entity.XaPhuong;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/**
 * Repository truy cập dữ liệu cho XaPhuongRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface XaPhuongRepository extends JpaRepository<XaPhuong, Integer> {

    @EntityGraph(attributePaths = {"tinhThanh"})
    @Query("""
            SELECT x FROM XaPhuong x
            WHERE x.tinhThanh.id = :tinhThanhId
            ORDER BY x.ten ASC
            """)
    List<XaPhuong> findByTinhThanh_IdOrderByTenAsc(Integer tinhThanhId);

    @Query("""
            SELECT x FROM XaPhuong x
            WHERE x.tinhThanh.id = :tinhThanhId
              AND UPPER(x.ten) = UPPER(:ten)
            """)
    Optional<XaPhuong> findByTinhThanh_IdAndTenIgnoreCase(Integer tinhThanhId, String ten);
}

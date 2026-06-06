package com.phuocloc.projectfinal.recruit.auth.repository;

import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.VaiTroHeThong;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/**
 * Repository truy cập dữ liệu cho RolesRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface RolesRepository extends JpaRepository<VaiTroHeThong, Integer> {

    @Query("SELECT v FROM VaiTroHeThong v WHERE v.ten = :ten")
    Optional<VaiTroHeThong> findByTen(String ten);

    @Query("SELECT v FROM VaiTroHeThong v WHERE UPPER(v.ten) = UPPER(:ten)")
    Optional<VaiTroHeThong> findByTenIgnoreCase(String ten);

    @Query("""
            SELECT CASE WHEN COUNT(v) > 0 THEN TRUE ELSE FALSE END
            FROM VaiTroHeThong v
            WHERE v.ten = :ten
            """)
    boolean existsByTen(String ten);

    @Query("""
            SELECT CASE WHEN COUNT(v) > 0 THEN TRUE ELSE FALSE END
            FROM VaiTroHeThong v
            WHERE UPPER(v.ten) = UPPER(:ten)
            """)
    boolean existsByTenIgnoreCase(String ten);

    @Query("SELECT v FROM VaiTroHeThong v ORDER BY v.id asc")
    List<VaiTroHeThong> findAllByOrderByIdAsc();
}

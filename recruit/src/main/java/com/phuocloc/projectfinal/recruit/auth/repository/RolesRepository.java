package com.phuocloc.projectfinal.recruit.auth.repository;

import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.VaiTroHeThong;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository truy cập dữ liệu cho RolesRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface RolesRepository extends JpaRepository<VaiTroHeThong, Integer> {

    Optional<VaiTroHeThong> findByTen(String ten);

    Optional<VaiTroHeThong> findByTenIgnoreCase(String ten);

    boolean existsByTen(String ten);

    boolean existsByTenIgnoreCase(String ten);

    List<VaiTroHeThong> findAllByOrderByIdAsc();
}

package com.phuocloc.projectfinal.recruit.company.repository;

import com.phuocloc.projectfinal.recruit.domain.congty.entity.VaiTroCongTy;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository truy cập dữ liệu cho VaiTroCongTyRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface VaiTroCongTyRepository extends JpaRepository<VaiTroCongTy, Integer> {

    Optional<VaiTroCongTy> findByTenIgnoreCase(String ten);

    boolean existsByTenIgnoreCase(String ten);

    List<VaiTroCongTy> findAllByOrderByIdAsc();
}

package com.phuocloc.projectfinal.recruit.domain.ai.repository;

import com.phuocloc.projectfinal.recruit.domain.ai.entity.ChiMucNhungDonUngTuyen;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository truy cập dữ liệu cho ChiMucNhungDonUngTuyenRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface ChiMucNhungDonUngTuyenRepository extends JpaRepository<ChiMucNhungDonUngTuyen, Integer> {

    Optional<ChiMucNhungDonUngTuyen> findByDonUngTuyen_Id(Integer donUngTuyenId);
}


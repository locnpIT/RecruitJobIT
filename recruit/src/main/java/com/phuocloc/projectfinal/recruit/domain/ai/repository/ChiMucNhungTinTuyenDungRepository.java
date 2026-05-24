package com.phuocloc.projectfinal.recruit.domain.ai.repository;

import com.phuocloc.projectfinal.recruit.domain.ai.entity.ChiMucNhungTinTuyenDung;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository truy cập dữ liệu cho ChiMucNhungTinTuyenDungRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface ChiMucNhungTinTuyenDungRepository extends JpaRepository<ChiMucNhungTinTuyenDung, Integer> {

    Optional<ChiMucNhungTinTuyenDung> findFirstByTinTuyenDung_IdOrderByIdDesc(Integer tinTuyenDungId);
}

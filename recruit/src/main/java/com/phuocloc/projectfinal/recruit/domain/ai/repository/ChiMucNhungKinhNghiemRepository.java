package com.phuocloc.projectfinal.recruit.domain.ai.repository;

import com.phuocloc.projectfinal.recruit.domain.ai.entity.ChiMucNhungKinhNghiem;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

/**
 * Repository truy cập bảng ChiMucNhungKinhNghiem.
 */
public interface ChiMucNhungKinhNghiemRepository extends JpaRepository<ChiMucNhungKinhNghiem, Integer> {

    /** Lấy trạng thái index mới nhất của một kinh nghiệm. */
    Optional<ChiMucNhungKinhNghiem> findFirstByKinhNghiem_IdOrderByIdDesc(Integer kinhNghiemId);

    /** Xóa toàn bộ log khi kinh nghiệm bị xóa cứng. */
    @Transactional
    void deleteByKinhNghiem_Id(Integer kinhNghiemId);
}

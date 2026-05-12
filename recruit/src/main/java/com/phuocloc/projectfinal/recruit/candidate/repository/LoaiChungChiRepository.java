package com.phuocloc.projectfinal.recruit.candidate.repository;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.LoaiChungChi;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoaiChungChiRepository extends JpaRepository<LoaiChungChi, Integer> {
    List<LoaiChungChi> findAllByOrderByTenAsc();
}

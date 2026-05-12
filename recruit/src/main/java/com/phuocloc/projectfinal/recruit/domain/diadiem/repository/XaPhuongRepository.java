package com.phuocloc.projectfinal.recruit.domain.diadiem.repository;

import com.phuocloc.projectfinal.recruit.domain.diadiem.entity.XaPhuong;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface XaPhuongRepository extends JpaRepository<XaPhuong, Integer> {

    @EntityGraph(attributePaths = {"tinhThanh"})
    List<XaPhuong> findByTinhThanh_IdOrderByTenAsc(Integer tinhThanhId);

    Optional<XaPhuong> findByTinhThanh_IdAndTenIgnoreCase(Integer tinhThanhId, String ten);
}

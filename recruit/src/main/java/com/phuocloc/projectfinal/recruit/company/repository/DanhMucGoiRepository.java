package com.phuocloc.projectfinal.recruit.company.repository;

import com.phuocloc.projectfinal.recruit.domain.congty.entity.DanhMucGoi;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DanhMucGoiRepository extends JpaRepository<DanhMucGoi, Integer> {

    Optional<DanhMucGoi> findByMaGoiIgnoreCase(String maGoi);

    List<DanhMucGoi> findAllByOrderByIdAsc();
}

package com.phuocloc.projectfinal.recruit.domain.diadiem.repository;

import com.phuocloc.projectfinal.recruit.domain.diadiem.entity.TinhThanh;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TinhThanhRepository extends JpaRepository<TinhThanh, Integer> {

    Optional<TinhThanh> findByTenIgnoreCase(String ten);
}

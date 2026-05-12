package com.phuocloc.projectfinal.recruit.domain.tuyendung.repository;

import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.DonUngTuyen;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DonUngTuyenRepository extends JpaRepository<DonUngTuyen, Integer> {

    List<DonUngTuyen> findByTinTuyenDung_ChiNhanh_IdAndNgayXoaIsNullOrderByNgayTaoDesc(Integer chiNhanhId);
}

package com.phuocloc.projectfinal.recruit.company.repository;

import com.phuocloc.projectfinal.recruit.domain.congty.entity.ThanhVienCongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ThanhVienCongTyId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

/**
 * Repository truy cập dữ liệu cho ThanhVienCongTyRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface ThanhVienCongTyRepository extends JpaRepository<ThanhVienCongTy, ThanhVienCongTyId> {
    
    @Query("SELECT t FROM ThanhVienCongTy t " +
           "JOIN FETCH t.chiNhanh c " +
           "JOIN FETCH c.congTy ct " +
           "JOIN FETCH t.vaiTroCongTy v " +
           "WHERE t.nguoiDung.id = :userId AND t.ngayXoa IS NULL")
    List<ThanhVienCongTy> findActiveMembershipsByUserId(@Param("userId") Integer userId);
}

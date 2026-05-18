package com.phuocloc.projectfinal.recruit.domain.tuyendung.repository;

import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.DonUngTuyen;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository truy cập dữ liệu cho DonUngTuyenRepository.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface DonUngTuyenRepository extends JpaRepository<DonUngTuyen, Integer> {

    List<DonUngTuyen> findByTinTuyenDung_ChiNhanh_IdAndNgayXoaIsNullOrderByNgayTaoDesc(Integer chiNhanhId);

    Optional<DonUngTuyen> findByIdAndNgayXoaIsNull(Integer id);

    boolean existsByTinTuyenDung_IdAndHoSoUngVien_NguoiDung_IdAndNgayXoaIsNull(Integer tinTuyenDungId, Integer nguoiDungId);

    Optional<DonUngTuyen> findByTinTuyenDung_IdAndHoSoUngVien_NguoiDung_IdAndNgayXoaIsNull(Integer tinTuyenDungId, Integer nguoiDungId);

    List<DonUngTuyen> findByHoSoUngVien_NguoiDung_IdAndNgayXoaIsNullOrderByNgayTaoDesc(Integer nguoiDungId);
}

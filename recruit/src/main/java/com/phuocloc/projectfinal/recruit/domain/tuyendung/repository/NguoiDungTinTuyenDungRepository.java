package com.phuocloc.projectfinal.recruit.domain.tuyendung.repository;

import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.NguoiDungTinTuyenDung;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.NguoiDungTinTuyenDungId;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NguoiDungTinTuyenDungRepository extends JpaRepository<NguoiDungTinTuyenDung, NguoiDungTinTuyenDungId> {

    boolean existsByNguoiDung_IdAndTinTuyenDung_Id(Integer nguoiDungId, Integer tinTuyenDungId);

    Optional<NguoiDungTinTuyenDung> findByNguoiDung_IdAndTinTuyenDung_Id(Integer nguoiDungId, Integer tinTuyenDungId);

    @EntityGraph(attributePaths = {
            "tinTuyenDung",
            "tinTuyenDung.chiNhanh",
            "tinTuyenDung.chiNhanh.congTy",
            "tinTuyenDung.chiNhanh.xaPhuong",
            "tinTuyenDung.chiNhanh.xaPhuong.tinhThanh",
            "tinTuyenDung.nganhNghe",
            "tinTuyenDung.loaiHinhLamViec",
            "tinTuyenDung.capDoKinhNghiem"
    })
    List<NguoiDungTinTuyenDung> findByNguoiDung_IdOrderByNgayTaoDesc(Integer nguoiDungId);
}

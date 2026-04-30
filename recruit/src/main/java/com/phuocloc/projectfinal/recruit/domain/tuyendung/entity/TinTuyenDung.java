package com.phuocloc.projectfinal.recruit.domain.tuyendung.entity;

import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import com.phuocloc.projectfinal.recruit.domain.shared.entity.BaseEntity;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ChiNhanhCongTy;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.CapDoKinhNghiem;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.LoaiHinhLamViec;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.NganhNghe;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "TinTuyenDung")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class TinTuyenDung extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nguoiDangId")
    private NguoiDung nguoiDang;

    @Column(name = "tieuDe")
    private String tieuDe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nganhNgheId")
    private NganhNghe nganhNghe;

    @Column(name = "moTa", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "yeuCau", columnDefinition = "TEXT")
    private String yeuCau;

    @Column(name = "phucLoi", columnDefinition = "TEXT")
    private String phucLoi;

    @Column(name = "batBuocCV")
    private Boolean batBuocCV;

    @Column(name = "mauCvUrl")
    private String mauCvUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loaiHinhLamViecId")
    private LoaiHinhLamViec loaiHinhLamViec;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "capDoKinhNghiemId")
    private CapDoKinhNghiem capDoKinhNghiem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chiNhanhId")
    private ChiNhanhCongTy chiNhanh;

    @Column(name = "luongToiThieu")
    private Integer luongToiThieu;

    @Column(name = "luongToiDa")
    private Integer luongToiDa;

    @Column(name = "soLuongTuyen")
    private Integer soLuongTuyen;

    @Column(name = "trangThai")
    private String trangThai;

    @Column(name = "lyDoTuChoi", columnDefinition = "TEXT")
    private String lyDoTuChoi;

    @Column(name = "denHanLuc")
    private LocalDateTime denHanLuc;
}

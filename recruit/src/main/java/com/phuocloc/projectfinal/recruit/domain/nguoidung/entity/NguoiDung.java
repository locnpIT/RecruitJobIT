package com.phuocloc.projectfinal.recruit.domain.nguoidung.entity;

import com.phuocloc.projectfinal.recruit.domain.shared.entity.BaseEntity;
import com.phuocloc.projectfinal.recruit.domain.diadiem.entity.XaPhuong;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "NguoiDung")
public class NguoiDung extends BaseEntity {

    @Column(name = "email")
    private String email;

    @Column(name = "matKhauBam")
    private String matKhauBam;

    @Column(name = "ten")
    private String ten;

    @Column(name = "ho")
    private String ho;

    @Column(name = "soDienThoai")
    private String soDienThoai;

    @Column(name = "anhDaiDienUrl")
    private String anhDaiDienUrl;

    @Column(name = "dangHoatDong")
    private Boolean dangHoatDong;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vaiTroHeThongId")
    private VaiTroHeThong vaiTroHeThong;

    @Column(name = "ngaySinh")
    private LocalDate ngaySinh;

    @Column(name = "gioiTinh")
    private String gioiTinh;

    @Column(name = "diaChiChiTiet")
    private String diaChiChiTiet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maXaPhuong")
    private XaPhuong xaPhuong;
}

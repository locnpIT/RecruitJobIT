package com.phuocloc.projectfinal.recruit.domain.ungvien.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "HocVanUngVien")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HocVanUngVien {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hoSoUngVienId")
    private HoSoUngVien hoSoUngVien;

    @Column(name = "tenTruong")
    private String tenTruong;

    @Column(name = "chuyenNganh")
    private String chuyenNganh;

    @Column(name = "bacHoc")
    private String bacHoc;

    @Column(name = "thoiGianBatDau")
    private LocalDate thoiGianBatDau;

    @Column(name = "thoiGianKetThuc")
    private LocalDate thoiGianKetThuc;

    @Column(name = "duongDanTep")
    private String duongDanTep;

    @Column(name = "trangThai")
    private String trangThai;
}

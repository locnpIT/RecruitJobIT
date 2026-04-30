package com.phuocloc.projectfinal.recruit.domain.ungvien.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "ChungChiUngVien")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChungChiUngVien {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hoSoUngVienId")
    private HoSoUngVien hoSoUngVien;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loaiChungChiId")
    private LoaiChungChi loaiChungChi;

    @Column(name = "tenChungChi")
    private String tenChungChi;

    @Column(name = "ngayBatDau")
    private LocalDate ngayBatDau;

    @Column(name = "ngayHetHan")
    private LocalDate ngayHetHan;

    @Column(name = "duongDanTep")
    private String duongDanTep;

    @Column(name = "trangThai")
    private String trangThai;
}

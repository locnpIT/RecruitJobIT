package com.phuocloc.projectfinal.recruit.domain.ungvien.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "KinhNghiemLamViecUngVien")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KinhNghiemLamViecUngVien {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hoSoUngVienId")
    private HoSoUngVien hoSoUngVien;

    @Column(name = "tenCongTy")
    private String tenCongTy;

    @Column(name = "chucDanh")
    private String chucDanh;

    @Column(name = "moTaCongViec", columnDefinition = "TEXT")
    private String moTaCongViec;

    @Column(name = "thoiGianBatDau")
    private LocalDate thoiGianBatDau;

    @Column(name = "thoiGianKetThuc")
    private LocalDate thoiGianKetThuc;
}

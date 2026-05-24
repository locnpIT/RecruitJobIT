package com.phuocloc.projectfinal.recruit.domain.ungvien.entity;

import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

/**
 * Entity ánh xạ dữ liệu cho HocVanUngVien.
 * Dùng bởi JPA để đọc/ghi dữ liệu tương ứng trong cơ sở dữ liệu.
 */
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
    @JoinColumn(name = "nguoiDungId")
    private NguoiDung nguoiDung;

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

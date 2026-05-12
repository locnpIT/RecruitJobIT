package com.phuocloc.projectfinal.recruit.domain.congty.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "DangKyGoiCongTy")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DangKyGoiCongTy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @CreationTimestamp
    @Column(name = "ngayTao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "congTyId")
    private CongTy congTy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "danhMucGoiId")
    private DanhMucGoi danhMucGoi;

    @Column(name = "trangThai")
    private String trangThai;

    @Column(name = "batDauLuc")
    private LocalDateTime batDauLuc;

    @Column(name = "hetHanLuc")
    private LocalDateTime hetHanLuc;

    @Column(name = "giaTaiThoiDiemDangKy")
    private Float giaTaiThoiDiemDangKy;

    @Column(name = "trangThaiThanhToan")
    private String trangThaiThanhToan;
}

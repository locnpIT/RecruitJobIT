package com.phuocloc.projectfinal.recruit.domain.congty.entity;

import com.phuocloc.projectfinal.recruit.domain.shared.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "DangKyGoiCongTy")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class DangKyGoiCongTy extends BaseEntity {

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

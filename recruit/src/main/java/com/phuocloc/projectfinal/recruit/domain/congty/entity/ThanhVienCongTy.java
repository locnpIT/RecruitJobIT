package com.phuocloc.projectfinal.recruit.domain.congty.entity;

import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "ThanhVienCongTy")
@IdClass(ThanhVienCongTyId.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ThanhVienCongTy {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nguoiDungId")
    private NguoiDung nguoiDung;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chiNhanhId")
    private ChiNhanhCongTy chiNhanh;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vaiTroCongTyId")
    private VaiTroCongTy vaiTroCongTy;

    @Column(name = "trangThai")
    private String trangThai;

    @CreationTimestamp
    @Column(name = "ngayTao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;

    @UpdateTimestamp
    @Column(name = "ngayCapNhat", nullable = false)
    private LocalDateTime ngayCapNhat;

    @Column(name = "ngayXoa")
    private LocalDateTime ngayXoa;
}

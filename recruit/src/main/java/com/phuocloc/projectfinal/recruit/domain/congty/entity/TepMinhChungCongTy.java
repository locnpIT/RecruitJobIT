package com.phuocloc.projectfinal.recruit.domain.congty.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "TepMinhChungCongTy")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TepMinhChungCongTy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @CreationTimestamp
    @Column(name = "ngayTao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;

    @UpdateTimestamp
    @Column(name = "ngayCapNhat", nullable = false)
    private LocalDateTime ngayCapNhat;

    @Column(name = "ngayXoa")
    private LocalDateTime ngayXoa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "congTyId")
    private CongTy congTy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loaiTaiLieuId")
    private LoaiTaiLieu loaiTaiLieu;

    @Column(name = "duongDanTep")
    private String duongDanTep;

    @Column(name = "tenTep")
    private String tenTep;

    @Column(name = "trangThai")
    private String trangThai;

    @Column(name = "lyDoTuChoi", columnDefinition = "TEXT")
    private String lyDoTuChoi;
}

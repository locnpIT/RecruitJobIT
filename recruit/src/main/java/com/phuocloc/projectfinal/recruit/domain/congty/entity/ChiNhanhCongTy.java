package com.phuocloc.projectfinal.recruit.domain.congty.entity;

import com.phuocloc.projectfinal.recruit.domain.diadiem.entity.XaPhuong;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "ChiNhanhCongTy")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChiNhanhCongTy {

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

    @Column(name = "ten")
    private String ten;

    @Column(name = "diaChiChiTiet")
    private String diaChiChiTiet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "xaPhuongId")
    private XaPhuong xaPhuong;

    @Column(name = "laTruSoChinh")
    private Boolean laTruSoChinh;
}

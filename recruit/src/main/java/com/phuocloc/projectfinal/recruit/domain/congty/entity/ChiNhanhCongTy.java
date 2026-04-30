package com.phuocloc.projectfinal.recruit.domain.congty.entity;

import com.phuocloc.projectfinal.recruit.domain.shared.entity.BaseEntity;
import com.phuocloc.projectfinal.recruit.domain.diadiem.entity.XaPhuong;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ChiNhanhCongTy")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class ChiNhanhCongTy extends BaseEntity {

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

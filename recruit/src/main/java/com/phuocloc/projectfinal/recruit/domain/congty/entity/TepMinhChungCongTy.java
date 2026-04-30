package com.phuocloc.projectfinal.recruit.domain.congty.entity;

import com.phuocloc.projectfinal.recruit.domain.shared.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "TepMinhChungCongTy")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class TepMinhChungCongTy extends BaseEntity {

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

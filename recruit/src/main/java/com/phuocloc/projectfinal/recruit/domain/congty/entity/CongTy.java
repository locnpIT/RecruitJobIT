package com.phuocloc.projectfinal.recruit.domain.congty.entity;

import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import com.phuocloc.projectfinal.recruit.domain.shared.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "CongTy")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class CongTy extends BaseEntity {

    @Column(name = "ten")
    private String ten;

    @Column(name = "maSoThue")
    private String maSoThue;

    @Column(name = "moTa", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "website")
    private String website;

    @Column(name = "logoUrl")
    private String logoUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chuCongTy")
    private NguoiDung chuCongTy;

    @Column(name = "trangThai")
    private String trangThai;

    @Column(name = "lyDoTuChoi", columnDefinition = "TEXT")
    private String lyDoTuChoi;
}

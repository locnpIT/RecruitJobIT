package com.phuocloc.projectfinal.recruit.domain.tuyendung.entity;

import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.KyNang;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "KyNangTinTuyenDung")
@IdClass(KyNangTinTuyenDungId.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KyNangTinTuyenDung {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tinTuyenDungId")
    private TinTuyenDung tinTuyenDung;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kyNangId")
    private KyNang kyNang;
}

package com.phuocloc.projectfinal.recruit.domain.chat.entity;

import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import com.phuocloc.projectfinal.recruit.domain.shared.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "CuocTroChuyen")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class CuocTroChuyen extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ungVienId")
    private NguoiDung ungVien;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nhaTuyenDungId")
    private NguoiDung nhaTuyenDung;
}

package com.phuocloc.projectfinal.recruit.domain.ungvien.entity;

import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.KyNang;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "KyNangUngVien")
@IdClass(KyNangUngVienId.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KyNangUngVien {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hoSoUngVienId")
    private HoSoUngVien hoSoUngVien;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kyNangId")
    private KyNang kyNang;
}

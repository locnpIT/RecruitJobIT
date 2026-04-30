package com.phuocloc.projectfinal.recruit.domain.ungvien.entity;

import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.NganhNghe;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "NganhNgheUngVien")
@IdClass(NganhNgheUngVienId.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NganhNgheUngVien {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hoSoUngVienId")
    private HoSoUngVien hoSoUngVien;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nganhNgheId")
    private NganhNghe nganhNghe;
}

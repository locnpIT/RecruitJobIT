package com.phuocloc.projectfinal.recruit.domain.ai.entity;

import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.DonUngTuyen;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "KetQuaPhuHopViecLam")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KetQuaPhuHopViecLam {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "donUngTuyenId")
    private DonUngTuyen donUngTuyen;

    @Column(name = "diemNguNghia")
    private Float diemNguNghia;

    @Column(name = "diemKyNang")
    private Float diemKyNang;

    @Column(name = "diemKinhNghiem")
    private Float diemKinhNghiem;

    @Column(name = "diemCuoi")
    private Float diemCuoi;

    @Column(name = "mucDoPhuHop")
    private String mucDoPhuHop;
}

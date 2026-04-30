package com.phuocloc.projectfinal.recruit.domain.ai.entity;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoUngVien;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ChiMucNhungHoSoUngVien")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChiMucNhungHoSoUngVien {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hoSoUngVienId")
    private HoSoUngVien hoSoUngVien;

    @Column(name = "maDiem")
    private String maDiem;

    @Column(name = "trangThai")
    private String trangThai;
}

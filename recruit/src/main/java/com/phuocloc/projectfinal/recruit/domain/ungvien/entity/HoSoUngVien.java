package com.phuocloc.projectfinal.recruit.domain.ungvien.entity;

import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "HoSoUngVien")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HoSoUngVien {

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
    @JoinColumn(name = "nguoiDungId")
    private NguoiDung nguoiDung;

    @Column(name = "mucTieuNgheNghiep", columnDefinition = "TEXT")
    private String mucTieuNgheNghiep;

    @Column(name = "gioiThieuBanThan", columnDefinition = "TEXT")
    private String gioiThieuBanThan;
}

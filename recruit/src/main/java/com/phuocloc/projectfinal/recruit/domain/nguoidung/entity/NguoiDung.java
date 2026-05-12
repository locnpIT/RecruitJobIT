package com.phuocloc.projectfinal.recruit.domain.nguoidung.entity;

import com.phuocloc.projectfinal.recruit.domain.diadiem.entity.XaPhuong;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "NguoiDung")
public class NguoiDung {

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

    @Column(name = "email")
    private String email;

    @Column(name = "matKhauBam")
    private String matKhauBam;

    @Column(name = "ten")
    private String ten;

    @Column(name = "ho")
    private String ho;

    @Column(name = "soDienThoai")
    private String soDienThoai;

    @Column(name = "anhDaiDienUrl")
    private String anhDaiDienUrl;

    @Column(name = "dangHoatDong")
    private Boolean dangHoatDong;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vaiTroHeThongId")
    private VaiTroHeThong vaiTroHeThong;

    @Column(name = "ngaySinh")
    private LocalDate ngaySinh;

    @Column(name = "gioiTinh")
    private String gioiTinh;

    @Column(name = "diaChiChiTiet")
    private String diaChiChiTiet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maXaPhuong")
    private XaPhuong xaPhuong;
}

package com.phuocloc.projectfinal.recruit.domain.tuyendung.entity;

import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ChiNhanhCongTy;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.CapDoKinhNghiem;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.LoaiHinhLamViec;
import com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity.NganhNghe;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * Entity ánh xạ dữ liệu cho TinTuyenDung.
 * Dùng bởi JPA để đọc/ghi dữ liệu tương ứng trong cơ sở dữ liệu.
 */
@Entity
@Table(name = "TinTuyenDung")
@Data
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@NoArgsConstructor
@AllArgsConstructor
public class TinTuyenDung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
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
    @JoinColumn(name = "nguoiDangId")
    private NguoiDung nguoiDang;

    @Column(name = "tieuDe")
    private String tieuDe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nganhNgheId")
    private NganhNghe nganhNghe;

    @Column(name = "moTa", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "yeuCau", columnDefinition = "TEXT")
    private String yeuCau;

    @Column(name = "phucLoi", columnDefinition = "TEXT")
    private String phucLoi;

    @Column(name = "batBuocCV")
    private Boolean batBuocCV;

    @Column(name = "mauCvUrl")
    private String mauCvUrl;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "TinTuyenDung_LoaiHinhLamViec",
            joinColumns = @JoinColumn(name = "tinTuyenDungId"),
            inverseJoinColumns = @JoinColumn(name = "loaiHinhLamViecId")
    )
    private java.util.Set<LoaiHinhLamViec> loaiHinhLamViecs = new java.util.LinkedHashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "capDoKinhNghiemId")
    private CapDoKinhNghiem capDoKinhNghiem;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "TinTuyenDung_ChiNhanhCongTy",
            joinColumns = @JoinColumn(name = "tinTuyenDungId"),
            inverseJoinColumns = @JoinColumn(name = "chiNhanhId")
    )
    private java.util.Set<ChiNhanhCongTy> chiNhanhs = new java.util.LinkedHashSet<>();

    @Column(name = "luongToiThieu")
    private Integer luongToiThieu;

    @Column(name = "luongToiDa")
    private Integer luongToiDa;

    @Column(name = "soLuongTuyen")
    private Integer soLuongTuyen;

    @Column(name = "trangThai")
    private String trangThai;

    @Column(name = "lyDoTuChoi", columnDefinition = "TEXT")
    private String lyDoTuChoi;

    @Column(name = "denHanLuc")
    private LocalDateTime denHanLuc;

    public ChiNhanhCongTy firstBranch() {
        if (chiNhanhs == null || chiNhanhs.isEmpty()) return null;
        return chiNhanhs.iterator().next();
    }

    public List<LoaiHinhLamViec> getEffectiveWorkTypes() {
        if (loaiHinhLamViecs == null || loaiHinhLamViecs.isEmpty()) return List.of();
        return loaiHinhLamViecs.stream()
                .filter(java.util.Objects::nonNull)
                .toList();
    }
}

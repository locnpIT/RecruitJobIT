package com.phuocloc.projectfinal.recruit.domain.congty.entity;

import com.phuocloc.projectfinal.recruit.domain.diadiem.entity.XaPhuong;
import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * Entity ánh xạ dữ liệu cho ChiNhanhCongTy.
 * Dùng bởi JPA để đọc/ghi dữ liệu tương ứng trong cơ sở dữ liệu.
 */
@Entity
@Table(name = "ChiNhanhCongTy")
@Data
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@NoArgsConstructor
@AllArgsConstructor
public class ChiNhanhCongTy {

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
    @JoinColumn(name = "congTyId")
    private CongTy congTy;

    @Column(name = "ten")
    private String ten;

    @Column(name = "diaChiChiTiet")
    private String diaChiChiTiet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "xaPhuongId")
    private XaPhuong xaPhuong;

    @Column(name = "laTruSoChinh")
    private Boolean laTruSoChinh;

    @ManyToMany(mappedBy = "chiNhanhs")
    private Set<TinTuyenDung> tinTuyenDungs = new LinkedHashSet<>();
}

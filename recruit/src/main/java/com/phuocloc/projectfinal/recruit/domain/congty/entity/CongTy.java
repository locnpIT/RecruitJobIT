package com.phuocloc.projectfinal.recruit.domain.congty.entity;

import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * Entity ánh xạ dữ liệu cho CongTy.
 * Dùng bởi JPA để đọc/ghi dữ liệu tương ứng trong cơ sở dữ liệu.
 */
@Entity
@Table(
        name = "CongTy",
        uniqueConstraints = {
                // Mỗi công ty chỉ có một mã số thuế duy nhất.
                @UniqueConstraint(name = "uk_cong_ty_ma_so_thue", columnNames = "maSoThue")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CongTy {

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

    @Column(name = "ten")
    private String ten;

    @Column(name = "maSoThue", nullable = false)
    private String maSoThue;

    @Column(name = "moTa", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "website")
    private String website;

    @Column(name = "logo_url")
    private String logoUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chuCongTy")
    private NguoiDung chuCongTy;

    @Column(name = "trangThai")
    private String trangThai;

    @Column(name = "lyDoTuChoi", columnDefinition = "TEXT")
    private String lyDoTuChoi;
}

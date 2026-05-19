package com.phuocloc.projectfinal.recruit.domain.congty.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Entity ánh xạ dữ liệu cho DanhMucGoi.
 * Dùng bởi JPA để đọc/ghi dữ liệu tương ứng trong cơ sở dữ liệu.
 */
@Entity
@Table(
        name = "DanhMucGoi",
        uniqueConstraints = {
                // Mã gói dùng làm business key để tra cứu/cập nhật gói.
                @UniqueConstraint(name = "uk_danh_muc_goi_ma_goi", columnNames = "maGoi")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DanhMucGoi {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "maGoi", nullable = false)
    private String maGoi;

    @Column(name = "tenGoi")
    private String tenGoi;

    @Column(name = "moTa", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "giaNiemYet")
    private Float giaNiemYet;
}

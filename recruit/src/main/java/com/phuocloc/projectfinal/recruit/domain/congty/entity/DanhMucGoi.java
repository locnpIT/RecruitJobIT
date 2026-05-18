package com.phuocloc.projectfinal.recruit.domain.congty.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Entity ánh xạ dữ liệu cho DanhMucGoi.
 * Dùng bởi JPA để đọc/ghi dữ liệu tương ứng trong cơ sở dữ liệu.
 */
@Entity
@Table(name = "DanhMucGoi")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DanhMucGoi {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "maGoi")
    private String maGoi;

    @Column(name = "tenGoi")
    private String tenGoi;

    @Column(name = "moTa", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "giaNiemYet")
    private Float giaNiemYet;
}

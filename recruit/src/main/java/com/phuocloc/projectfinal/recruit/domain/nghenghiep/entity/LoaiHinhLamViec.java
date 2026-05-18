package com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Entity ánh xạ dữ liệu cho LoaiHinhLamViec.
 * Dùng bởi JPA để đọc/ghi dữ liệu tương ứng trong cơ sở dữ liệu.
 */
@Entity
@Table(name = "LoaiHinhLamViec")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoaiHinhLamViec {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "ten")
    private String ten;

    @Column(name = "moTa")
    private String moTa;
}

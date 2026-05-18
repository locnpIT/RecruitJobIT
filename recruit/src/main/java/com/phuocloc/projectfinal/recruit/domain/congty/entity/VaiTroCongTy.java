package com.phuocloc.projectfinal.recruit.domain.congty.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Entity ánh xạ dữ liệu cho VaiTroCongTy.
 * Dùng bởi JPA để đọc/ghi dữ liệu tương ứng trong cơ sở dữ liệu.
 */
@Entity
@Table(name = "VaiTroCongTy")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VaiTroCongTy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "ten")
    private String ten;

    @Column(name = "moTa")
    private String moTa;
}

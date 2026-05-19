package com.phuocloc.projectfinal.recruit.domain.nguoidung.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity ánh xạ dữ liệu cho VaiTroHeThong.
 * Dùng bởi JPA để đọc/ghi dữ liệu tương ứng trong cơ sở dữ liệu.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "VaiTroHeThong",
        uniqueConstraints = {
                // Tên vai trò hệ thống (ADMIN/CANDIDATE/...) không được trùng.
                @UniqueConstraint(name = "uk_vai_tro_he_thong_ten", columnNames = "ten")
        }
)
public class VaiTroHeThong {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "ten", nullable = false)
    private String ten;

    @Column(name = "moTa")
    private String moTa;
}

package com.phuocloc.projectfinal.recruit.domain.ungvien.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "LoaiChungChi")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoaiChungChi {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "ten")
    private String ten;

    @Column(name = "moTa")
    private String moTa;
}

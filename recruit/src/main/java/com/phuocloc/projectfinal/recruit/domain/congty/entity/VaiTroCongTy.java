package com.phuocloc.projectfinal.recruit.domain.congty.entity;

import jakarta.persistence.*;
import lombok.*;

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

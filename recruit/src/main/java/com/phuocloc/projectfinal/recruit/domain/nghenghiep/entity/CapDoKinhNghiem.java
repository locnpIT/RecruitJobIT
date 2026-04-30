package com.phuocloc.projectfinal.recruit.domain.nghenghiep.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "CapDoKinhNghiem")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CapDoKinhNghiem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "ten")
    private String ten;

    @Column(name = "moTa")
    private String moTa;
}

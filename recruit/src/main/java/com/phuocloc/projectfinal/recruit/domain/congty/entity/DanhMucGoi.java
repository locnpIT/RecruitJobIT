package com.phuocloc.projectfinal.recruit.domain.congty.entity;

import jakarta.persistence.*;
import lombok.*;

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

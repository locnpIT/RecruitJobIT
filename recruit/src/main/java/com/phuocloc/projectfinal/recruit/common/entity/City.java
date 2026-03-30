package com.phuocloc.projectfinal.recruit.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "tinhThanh")
public class City {

    @Id
    @Column(name = "ma", nullable = false, length = 20)
    private String code;

    @Column(name = "ten", nullable = false, length = 150)
    private String name;

    @Column(name = "vung", nullable = false, length = 120)
    private String region;
}

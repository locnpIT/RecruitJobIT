package com.phuocloc.projectfinal.recruit.domain.nguoidung.entity;

import com.phuocloc.projectfinal.recruit.domain.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "VaiTroHeThong")
public class VaiTroHeThong extends BaseEntity {

    @Column(name = "ten")
    private String ten;

    @Column(name = "moTa")
    private String moTa;
}

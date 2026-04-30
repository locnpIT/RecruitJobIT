package com.phuocloc.projectfinal.recruit.domain.ungvien.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KyNangUngVienId implements Serializable {
    private Integer hoSoUngVien;
    private Integer kyNang;
}

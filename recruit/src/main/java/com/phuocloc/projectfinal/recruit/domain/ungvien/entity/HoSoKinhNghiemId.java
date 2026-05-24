package com.phuocloc.projectfinal.recruit.domain.ungvien.entity;

import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HoSoKinhNghiemId implements Serializable {
    private Integer hoSoUngVien;
    private Integer kinhNghiem;
}


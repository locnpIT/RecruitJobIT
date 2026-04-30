package com.phuocloc.projectfinal.recruit.domain.congty.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ThanhVienCongTyId implements Serializable {
    private Integer nguoiDung;
    private Integer chiNhanh;
}

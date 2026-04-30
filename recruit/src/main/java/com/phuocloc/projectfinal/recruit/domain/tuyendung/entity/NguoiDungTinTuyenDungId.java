package com.phuocloc.projectfinal.recruit.domain.tuyendung.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NguoiDungTinTuyenDungId implements Serializable {
    private Integer nguoiDung;
    private Integer tinTuyenDung;
}

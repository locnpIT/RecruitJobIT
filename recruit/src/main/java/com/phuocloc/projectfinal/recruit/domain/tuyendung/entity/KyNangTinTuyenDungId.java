package com.phuocloc.projectfinal.recruit.domain.tuyendung.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KyNangTinTuyenDungId implements Serializable {
    private Integer tinTuyenDung;
    private Integer kyNang;
}

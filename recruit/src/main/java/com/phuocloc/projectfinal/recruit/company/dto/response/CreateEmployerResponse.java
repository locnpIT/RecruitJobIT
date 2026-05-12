package com.phuocloc.projectfinal.recruit.company.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateEmployerResponse {

    private Long hoSoNhaTuyenDungId;
    private Long nguoiDungId;
    private String email;
    private String ten;
    private String ho;
    private String soDienThoai;
    private Long congTyId;
    private Long chiNhanhId;
    private String vaiTroHeThong;
    private String vaiTroCongTy;
    private Boolean dangHoatDong;
}

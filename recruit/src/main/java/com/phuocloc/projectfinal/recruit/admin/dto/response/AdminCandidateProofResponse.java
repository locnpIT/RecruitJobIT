package com.phuocloc.projectfinal.recruit.admin.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminCandidateProofResponse {

    private Long id;
    private Long hoSoUngVienId;
    private String loai;
    private String tieuDe;
    private String moTa;
    private String ungVienHoTen;
    private String ungVienEmail;
    private String duongDanTep;
    private String trangThai;
}

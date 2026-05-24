package com.phuocloc.projectfinal.recruit.candidate.dto.request;

import lombok.Getter;
import lombok.Setter;

/**
 * DTO nhận dữ liệu đầu vào từ client cho API CreateCandidateProfileRequest.
 * Chỉ chứa dữ liệu trao đổi, không chứa nghiệp vụ xử lý.
 */
@Getter
@Setter
public class CreateCandidateProfileRequest {
    private String tenHoSo;
    private String mucTieuNgheNghiep;
    private String gioiThieuBanThan;
}

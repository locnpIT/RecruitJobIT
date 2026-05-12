package com.phuocloc.projectfinal.recruit.company.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateCompanyInfoRequest {

    @Size(max = 255, message = "Tên công ty không được quá 255 ký tự")
    private String tenCongTy;

    @Size(max = 50, message = "Mã số thuế không được quá 50 ký tự")
    private String maSoThue;

    @Size(max = 255, message = "Website không được quá 255 ký tự")
    private String website;

    @Size(max = 4000, message = "Mô tả công ty không được quá 4000 ký tự")
    private String moTaCongTy;
}

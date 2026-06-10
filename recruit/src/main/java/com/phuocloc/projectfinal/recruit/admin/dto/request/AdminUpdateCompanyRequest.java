package com.phuocloc.projectfinal.recruit.admin.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUpdateCompanyRequest {

    @NotBlank(message = "Tên công ty không được để trống")
    private String ten;

    private String website;

    private String moTa;
}

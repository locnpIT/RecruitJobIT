package com.phuocloc.projectfinal.recruit.admin.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUpdateCompanyBranchRequest {

    @NotBlank(message = "Tên chi nhánh không được để trống")
    private String ten;

    @NotBlank(message = "Địa chỉ chi nhánh không được để trống")
    private String diaChiChiTiet;

    private Long xaPhuongId;

    @NotNull(message = "laTruSoChinh không được để trống")
    private Boolean laTruSoChinh;
}

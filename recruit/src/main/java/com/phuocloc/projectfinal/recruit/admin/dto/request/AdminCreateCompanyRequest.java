package com.phuocloc.projectfinal.recruit.admin.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminCreateCompanyRequest {

    @NotBlank(message = "Tên công ty không được để trống")
    private String ten;

    @NotBlank(message = "Mã số thuế không được để trống")
    private String maSoThue;

    private String website;

    private String moTa;

    @Valid
    @NotEmpty(message = "Phải có ít nhất một chi nhánh")
    private List<BranchRequest> chiNhanhs;

    @Getter
    @Setter
    public static class BranchRequest {

        @NotBlank(message = "Tên chi nhánh không được để trống")
        private String ten;

        @NotBlank(message = "Địa chỉ chi nhánh không được để trống")
        private String diaChiChiTiet;

        private Long xaPhuongId;

        private Boolean laTruSoChinh;
    }
}

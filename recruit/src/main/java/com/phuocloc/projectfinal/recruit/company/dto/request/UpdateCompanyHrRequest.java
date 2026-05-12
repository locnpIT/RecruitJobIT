package com.phuocloc.projectfinal.recruit.company.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateCompanyHrRequest {

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Tên không được để trống")
    @Size(max = 100, message = "Tên không được vượt quá 100 ký tự")
    private String ten;

    @NotBlank(message = "Họ không được để trống")
    @Size(max = 100, message = "Họ không được vượt quá 100 ký tự")
    private String ho;

    @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
    private String soDienThoai;

    private Boolean dangHoatDong;

    @NotEmpty(message = "Cần chọn ít nhất một chi nhánh")
    private List<Long> chiNhanhIds = new ArrayList<>();
}


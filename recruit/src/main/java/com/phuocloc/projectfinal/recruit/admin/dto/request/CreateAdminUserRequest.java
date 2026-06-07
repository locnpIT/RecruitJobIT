package com.phuocloc.projectfinal.recruit.admin.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Data;

/**
 * Payload tạo tài khoản trực tiếp từ màn admin/users.
 * Chỉ tạo user độc lập; HR/Owner vẫn đi qua luồng công ty vì cần membership công ty/chi nhánh.
 */
@Data
public class CreateAdminUserRequest {

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự")
    private String matKhau;

    @NotBlank(message = "Tên không được để trống")
    @Size(max = 100, message = "Tên không được vượt quá 100 ký tự")
    private String ten;

    @NotBlank(message = "Họ không được để trống")
    @Size(max = 100, message = "Họ không được vượt quá 100 ký tự")
    private String ho;

    @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
    private String soDienThoai;

    @NotBlank(message = "Loại tài khoản không được để trống")
    private String loaiTaiKhoan;

    @NotNull(message = "dangHoatDong không được để trống")
    private Boolean dangHoatDong;

    @Size(max = 150, message = "Tên công ty không được vượt quá 150 ký tự")
    private String tenCongTy;

    @Size(max = 50, message = "Mã số thuế không được vượt quá 50 ký tự")
    private String maSoThue;

    @Size(max = 255, message = "Website không được vượt quá 255 ký tự")
    private String website;

    @Size(max = 5000, message = "Mô tả công ty không được vượt quá 5000 ký tự")
    private String moTaCongTy;

    @Size(max = 150, message = "Tên chi nhánh không được vượt quá 150 ký tự")
    private String tenChiNhanh;

    @Size(max = 255, message = "Địa chỉ chi nhánh không được vượt quá 255 ký tự")
    private String diaChiChiTietChiNhanh;

    private Long congTyId;

    private List<Long> chiNhanhIds;
}

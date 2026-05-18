package com.phuocloc.projectfinal.recruit.auth.dto.response;

import lombok.Builder;
import lombok.Getter;
import java.time.LocalDate;

/**
 * DTO trả dữ liệu từ server cho API UserProfileResponse.
 * Giữ response rõ ràng để frontend dễ hiển thị và bảo trì.
 */
@Getter
@Builder
public class UserProfileResponse {
    private Long id;
    private String email;
    private String ten;
    private String ho;
    private String soDienThoai;
    private LocalDate ngaySinh;
    private String gioiTinh;
    private String diaChiChiTiet;
    private Long xaPhuongId;
    private String xaPhuongTen;
    private Long tinhThanhId;
    private String tinhThanhTen;
    private String vaiTro;
    private Boolean dangHoatDong;
    private String anhDaiDienUrl;
}

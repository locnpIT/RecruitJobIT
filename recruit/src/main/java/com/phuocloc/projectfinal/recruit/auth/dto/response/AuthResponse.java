package com.phuocloc.projectfinal.recruit.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
public class AuthResponse {

    private ThongTinNguoiDung nguoiDung;
    private ThongTinPhienDangNhap phienDangNhap;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ThongTinNguoiDung {
        private Long id;
        private String email;
        private String ten;
        private String ho;
        private String soDienThoai;
        private String vaiTro;
        private Boolean dangHoatDong;
        private String anhDaiDienUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ThongTinPhienDangNhap {
        private String accessToken;
        private Long thoiHanTokenGiay;
    }
}

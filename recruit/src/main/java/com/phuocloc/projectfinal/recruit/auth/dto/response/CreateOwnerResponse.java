package com.phuocloc.projectfinal.recruit.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOwnerResponse {

    private ThongTinChuSoHuu chuSoHuu;
    private ThongTinCongTy congTy;
    private List<ThongTinChiNhanh> chiNhanhs;
    private AuthResponse.ThongTinPhienDangNhap phienDangNhap;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ThongTinChuSoHuu {
        private Long id;
        private String email;
        private String ten;
        private String ho;
        private String duongDanMinhChung;
        private String vaiTroHeThong;
        private String vaiTroCongTy;
        private Boolean dangHoatDong;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ThongTinCongTy {
        private Long id;
        private String ten;
        private String maSoThue;
        private String website;
        private String moTa;
        private String trangThai;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ThongTinChiNhanh {
        private Long id;
        private String ten;
        private String diaChiChiTiet;
        private Long xaPhuongId;
        private String xaPhuongTen;
        private Boolean laTruSoChinh;
    }
}

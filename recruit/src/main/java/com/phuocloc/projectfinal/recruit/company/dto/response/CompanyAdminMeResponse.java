package com.phuocloc.projectfinal.recruit.company.dto.response;

import java.util.List;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyAdminMeResponse {

    private ThongTinNguoiDung nguoiDung;
    private ThongTinCongTy congTy;
    private List<ThongTinChiNhanh> chiNhanhs;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ThongTinNguoiDung {
        private Long id;
        private String email;
        private String ten;
        private String ho;
        private String vaiTroHeThong;
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
        private String logoUrl;
        private String trangThai;
        private String lyDoTuChoi;
        private Boolean coQuyenDangBai;
        private String goiDangBaiTen;
        private LocalDateTime goiDangBaiHetHanLuc;
        private String goiDangBaiTrangThai;
        private String goiDangBaiTrangThaiThanhToan;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ThongTinChiNhanh {
        private Long chiNhanhId;
        private String chiNhanhTen;
        private Long congTyId;
        private String congTyTen;
        private String vaiTroCongTy;
        private Boolean laTruSoChinh;
        private String trangThai;
    }
}

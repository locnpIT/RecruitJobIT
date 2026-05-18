package com.phuocloc.projectfinal.recruit.company.dto.response;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO trả dữ liệu từ server cho API CompanyAdminHrResponse.
 * Giữ response rõ ràng để frontend dễ hiển thị và bảo trì.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyAdminHrResponse {

    private Long nguoiDungId;
    private String email;
    private String ten;
    private String ho;
    private String soDienThoai;
    private String vaiTroHeThong;
    private String vaiTroCongTy;
    private Boolean dangHoatDong;
    private String matKhauTam;
    private List<ThongTinChiNhanh> chiNhanhs;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ThongTinChiNhanh {
        private Long chiNhanhId;
        private String chiNhanhTen;
        private Boolean laTruSoChinh;
    }
}

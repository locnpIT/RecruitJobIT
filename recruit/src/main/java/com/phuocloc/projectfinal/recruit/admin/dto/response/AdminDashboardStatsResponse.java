package com.phuocloc.projectfinal.recruit.admin.dto.response;

import lombok.Builder;
import lombok.Data;

/**
 * DTO trả dữ liệu từ server cho API AdminDashboardStatsResponse.
 * Giữ response rõ ràng để frontend dễ hiển thị và bảo trì.
 */
@Data
@Builder
public class AdminDashboardStatsResponse {

    private long tongNguoiDung;
    private long nguoiDungHoatDong;
    private long nguoiDungKhongHoatDong;
    private long tongCongTy;
    private long congTyChoDuyet;
    private long congTyDaDuyet;
    private long congTyBiTuChoi;
}

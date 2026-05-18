package com.phuocloc.projectfinal.recruit.admin.dto.response;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

/**
 * DTO trả dữ liệu từ server cho API AdminReportResponse.
 * Giữ response rõ ràng để frontend dễ hiển thị và bảo trì.
 */
@Getter
@Builder
public class AdminReportResponse {

    private List<Metric> chiSo;
    private List<Integer> duLieuXuHuong;
    private List<TopCompany> topCongTy;
    private SystemStatus trangThaiHeThong;

    @Getter
    @Builder
    public static class Metric {
        private String label;
        private String value;
        private String ghiChu;
    }

    @Getter
    @Builder
    public static class TopCompany {
        private String ten;
        private int soTin;
        private int soDon;
    }

    @Getter
    @Builder
    public static class SystemStatus {
        private String tyLeOnDinhApi;
        private String doTreTrungBinh;
        private int tacVuChoDuyet;
        private int suCoDangMo;
    }
}

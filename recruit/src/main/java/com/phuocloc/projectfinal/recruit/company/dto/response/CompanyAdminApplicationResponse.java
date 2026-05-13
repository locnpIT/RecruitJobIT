package com.phuocloc.projectfinal.recruit.company.dto.response;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyAdminApplicationResponse {

    private Long id;
    private String trangThai;
    private String cvUrl;
    private LocalDateTime ngayTao;
    private Long chiNhanhId;
    private String chiNhanhTen;
    private Long congTyId;
    private String congTyTen;
    private Long tinTuyenDungId;
    private String tieuDeTinTuyenDung;
    private Long nguoiDungId;
    private String ungVienHoTen;
    private String ungVienEmail;
    private String ungVienSoDienThoai;
    private String ungVienAnhDaiDienUrl;
    private Long hoSoUngVienId;
    private String gioiThieuBanThan;
    private String mucTieuNgheNghiep;
    private List<HocVanItem> hocVans;
    private List<ChungChiItem> chungChis;
    private List<KyNangItem> kyNangs;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HocVanItem {
        private Long id;
        private String tenTruong;
        private String chuyenNganh;
        private String bacHoc;
        private LocalDate thoiGianBatDau;
        private LocalDate thoiGianKetThuc;
        private String duongDanTep;
        private String trangThai;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChungChiItem {
        private Long id;
        private Long loaiChungChiId;
        private String loaiChungChiTen;
        private String tenChungChi;
        private LocalDate ngayBatDau;
        private LocalDate ngayHetHan;
        private String duongDanTep;
        private String trangThai;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class KyNangItem {
        private Long id;
        private String ten;
    }
}

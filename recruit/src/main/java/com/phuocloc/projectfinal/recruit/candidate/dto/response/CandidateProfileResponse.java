package com.phuocloc.projectfinal.recruit.candidate.dto.response;

import java.time.LocalDate;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CandidateProfileResponse {
    private Long hoSoUngVienId;
    private String gioiThieuBanThan;
    private String mucTieuNgheNghiep;
    private List<HocVanItem> hocVans;
    private List<KinhNghiemItem> kinhNghiems;
    private List<ChungChiItem> chungChis;
    private List<KyNangItem> kyNangs;
    private List<NganhNgheItem> nganhNghes;

    @Getter
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

    @Getter
    @Builder
    public static class KinhNghiemItem {
        private Long id;
        private String tenCongTy;
        private String chucDanh;
        private String moTaCongViec;
        private LocalDate thoiGianBatDau;
        private LocalDate thoiGianKetThuc;
    }

    @Getter
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

    @Getter
    @Builder
    public static class KyNangItem {
        private Long id;
        private String ten;
    }

    @Getter
    @Builder
    public static class NganhNgheItem {
        private Long id;
        private String ten;
    }
}

package com.phuocloc.projectfinal.recruit.company.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyAdminJobResponse {

    private Long id;
    private String tieuDe;
    private String trangThai;
    private Long chiNhanhId;
    private String chiNhanhTen;
    private Long congTyId;
    private String congTyTen;
    private String moTa;
    private String yeuCau;
    private String phucLoi;
    private Boolean batBuocCV;
    private String mauCvUrl;
    private Long nganhNgheId;
    private String nganhNgheTen;
    private Long loaiHinhLamViecId;
    private String loaiHinhLamViecTen;
    private Long capDoKinhNghiemId;
    private String capDoKinhNghiemTen;
    private Integer luongToiThieu;
    private Integer luongToiDa;
    private Integer soLuongTuyen;
    private String lyDoTuChoi;
    private LocalDateTime denHanLuc;
    private LocalDateTime ngayTao;
    private List<KyNangItem> kyNangs;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class KyNangItem {
        private Long id;
        private String ten;
    }
}

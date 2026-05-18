package com.phuocloc.projectfinal.recruit.publicjob.dto.response;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

/**
 * DTO trả dữ liệu từ server cho API PublicJobDetailResponse.
 * Giữ response rõ ràng để frontend dễ hiển thị và bảo trì.
 */
@Getter
@Builder
public class PublicJobDetailResponse {

    private Long id;
    private String maTin;
    private String tieuDe;
    private Long congTyId;
    private String trangThai;
    private String congTy;
    private Boolean congTyDaXacMinh;
    private Long nhaTuyenDungId;
    private String nhaTuyenDungTen;
    private String nganhNghe;
    private String quyMoCongTy;
    private String websiteCongTy;
    private String diaDiem;
    private String mucLuong;
    private String capDo;
    private String loaiHinhLamViec;
    private String kinhNghiem;
    private String hanNop;
    private String dangLuc;
    private String soLuongTuyen;
    private String capNhatLuc;
    private Boolean batBuocCV;
    private String mauCvUrl;
    private List<String> the;
    private List<String> kyNangs;
    private List<String> moTa;
    private List<String> yeuCau;
    private List<String> phucLoi;
    private String moTaCongTy;
    private List<PublicJobSummaryResponse> viecLamTuongTu;
}

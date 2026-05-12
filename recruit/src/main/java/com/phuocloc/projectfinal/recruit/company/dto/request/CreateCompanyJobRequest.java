package com.phuocloc.projectfinal.recruit.company.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateCompanyJobRequest {

    @NotNull(message = "chiNhanhId không được để trống")
    private Integer chiNhanhId;

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
    private String tieuDe;

    @NotNull(message = "nganhNgheId không được để trống")
    private Integer nganhNgheId;

    @NotBlank(message = "Mô tả không được để trống")
    private String moTa;

    @NotBlank(message = "Yêu cầu không được để trống")
    private String yeuCau;

    private String phucLoi;

    private Boolean batBuocCV;

    private String mauCvUrl;

    @NotNull(message = "loaiHinhLamViecId không được để trống")
    private Integer loaiHinhLamViecId;

    @NotNull(message = "capDoKinhNghiemId không được để trống")
    private Integer capDoKinhNghiemId;

    private Integer luongToiThieu;

    private Integer luongToiDa;

    @NotNull(message = "soLuongTuyen không được để trống")
    private Integer soLuongTuyen;

    private LocalDateTime denHanLuc;
}

package com.phuocloc.projectfinal.recruit.company.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO nhận dữ liệu đầu vào từ client cho API CreateCompanyJobRequest.
 * Chỉ chứa dữ liệu trao đổi, không chứa nghiệp vụ xử lý.
 */
@Getter
@Setter
public class CreateCompanyJobRequest implements JobPayloadRequest {

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

    @NotNull(message = "loaiHinhLamViecIds không được để trống")
    @Size(min = 1, message = "Phải chọn ít nhất một loại hình làm việc")
    private List<Integer> loaiHinhLamViecIds;

    @NotNull(message = "capDoKinhNghiemId không được để trống")
    private Integer capDoKinhNghiemId;

    private Integer luongToiThieu;

    private Integer luongToiDa;

    @NotNull(message = "soLuongTuyen không được để trống")
    private Integer soLuongTuyen;

    private LocalDateTime denHanLuc;

    private List<Integer> kyNangIds;

    @NotNull(message = "chiNhanhIds không được để trống")
    @Size(min = 1, message = "Phải chọn ít nhất một chi nhánh")
    private List<Integer> chiNhanhIds;
}

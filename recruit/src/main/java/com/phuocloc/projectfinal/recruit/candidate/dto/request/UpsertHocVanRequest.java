package com.phuocloc.projectfinal.recruit.candidate.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO nhận dữ liệu đầu vào từ client cho API UpsertHocVanRequest.
 * Chỉ chứa dữ liệu trao đổi, không chứa nghiệp vụ xử lý.
 */
@Getter
@Setter
public class UpsertHocVanRequest {
    @NotBlank
    private String tenTruong;
    private String chuyenNganh;
    private String bacHoc;
    private LocalDate thoiGianBatDau;
    private LocalDate thoiGianKetThuc;
    private String duongDanTep;
}

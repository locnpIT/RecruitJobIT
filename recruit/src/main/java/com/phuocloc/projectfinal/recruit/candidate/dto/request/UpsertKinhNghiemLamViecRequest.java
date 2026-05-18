package com.phuocloc.projectfinal.recruit.candidate.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO nhận dữ liệu đầu vào từ client cho API UpsertKinhNghiemLamViecRequest.
 * Chỉ chứa dữ liệu trao đổi, không chứa nghiệp vụ xử lý.
 */
@Getter
@Setter
public class UpsertKinhNghiemLamViecRequest {
    @NotBlank
    private String tenCongTy;
    private String chucDanh;
    private String moTaCongViec;
    private LocalDate thoiGianBatDau;
    private LocalDate thoiGianKetThuc;
}

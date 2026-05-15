package com.phuocloc.projectfinal.recruit.candidate.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

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

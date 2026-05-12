package com.phuocloc.projectfinal.recruit.candidate.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

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

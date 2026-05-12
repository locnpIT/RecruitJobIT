package com.phuocloc.projectfinal.recruit.candidate.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpsertChungChiRequest {
    @NotNull
    private Integer loaiChungChiId;
    @NotBlank
    private String tenChungChi;
    private LocalDate ngayBatDau;
    private LocalDate ngayHetHan;
    private String duongDanTep;
}

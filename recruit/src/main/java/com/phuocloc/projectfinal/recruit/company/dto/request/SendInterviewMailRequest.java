package com.phuocloc.projectfinal.recruit.company.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO nhận dữ liệu để gửi thư mời phỏng vấn cho ứng viên.
 */
@Getter
@Setter
public class SendInterviewMailRequest {

    @NotNull(message = "Thời gian phỏng vấn không được để trống")
    private LocalDateTime thoiGianPhongVan;

    @NotBlank(message = "Địa điểm phỏng vấn không được để trống")
    private String diaDiemPhongVan;

    private String ghiChu;
}

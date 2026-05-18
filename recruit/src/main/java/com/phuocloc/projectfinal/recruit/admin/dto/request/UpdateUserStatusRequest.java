package com.phuocloc.projectfinal.recruit.admin.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * DTO nhận dữ liệu đầu vào từ client cho API UpdateUserStatusRequest.
 * Chỉ chứa dữ liệu trao đổi, không chứa nghiệp vụ xử lý.
 */
@Data
public class UpdateUserStatusRequest {

    @NotNull(message = "dangHoatDong không được để trống")
    private Boolean dangHoatDong;
}

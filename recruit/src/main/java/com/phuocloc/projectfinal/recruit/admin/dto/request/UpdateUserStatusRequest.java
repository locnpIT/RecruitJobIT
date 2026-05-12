package com.phuocloc.projectfinal.recruit.admin.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateUserStatusRequest {

    @NotNull(message = "dangHoatDong không được để trống")
    private Boolean dangHoatDong;
}

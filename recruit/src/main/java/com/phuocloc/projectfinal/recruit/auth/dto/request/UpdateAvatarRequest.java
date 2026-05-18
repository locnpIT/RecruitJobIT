package com.phuocloc.projectfinal.recruit.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO nhận dữ liệu đầu vào từ client cho API UpdateAvatarRequest.
 * Chỉ chứa dữ liệu trao đổi, không chứa nghiệp vụ xử lý.
 */
@Getter
@Setter
public class UpdateAvatarRequest {

    @NotBlank
    private String anhDaiDienUrl;
}

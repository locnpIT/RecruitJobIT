package com.phuocloc.projectfinal.recruit.company.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO nhận dữ liệu đầu vào từ client cho API RegisterCompanyPackageRequest.
 * Chỉ chứa dữ liệu trao đổi, không chứa nghiệp vụ xử lý.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterCompanyPackageRequest {

    @NotNull(message = "Cần chọn gói")
    private Integer danhMucGoiId;
}

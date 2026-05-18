package com.phuocloc.projectfinal.recruit.company.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO nhận dữ liệu đầu vào từ client cho API UpdateCompanyProofRequest.
 * Chỉ chứa dữ liệu trao đổi, không chứa nghiệp vụ xử lý.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateCompanyProofRequest {

    @NotBlank(message = "Đường dẫn minh chứng không được để trống")
    @Size(max = 10000, message = "Đường dẫn minh chứng không được quá 10000 ký tự")
    private String duongDanTep;

    @Size(max = 255, message = "Tên tệp không được quá 255 ký tự")
    private String tenTep;
}

package com.phuocloc.projectfinal.recruit.admin.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO nhận dữ liệu đầu vào từ client cho API ReviewCompanyRequest.
 * Chỉ chứa dữ liệu trao đổi, không chứa nghiệp vụ xử lý.
 */
@Data
public class ReviewCompanyRequest {

    @Size(max = 2000, message = "Lý do từ chối không được quá 2000 ký tự")
    private String lyDoTuChoi;
}

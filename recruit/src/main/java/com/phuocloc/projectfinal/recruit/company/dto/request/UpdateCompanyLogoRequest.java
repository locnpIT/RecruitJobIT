package com.phuocloc.projectfinal.recruit.company.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO nhận dữ liệu đầu vào từ client cho API UpdateCompanyLogoRequest.
 * Chỉ chứa dữ liệu trao đổi, không chứa nghiệp vụ xử lý.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateCompanyLogoRequest {

    private String logoUrl;
}

package com.phuocloc.projectfinal.recruit.candidate.dto.request;

import lombok.Data;

/**
 * DTO nhận dữ liệu đầu vào từ client cho API CreateJobApplicationRequest.
 * Chỉ chứa dữ liệu trao đổi, không chứa nghiệp vụ xử lý.
 */
@Data
public class CreateJobApplicationRequest {

    private Long hoSoUngVienId;
    private String cvUrl;
}

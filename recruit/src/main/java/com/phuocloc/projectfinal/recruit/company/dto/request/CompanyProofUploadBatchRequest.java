package com.phuocloc.projectfinal.recruit.company.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO nhận dữ liệu đầu vào từ client cho API CompanyProofUploadBatchRequest.
 * Chỉ chứa dữ liệu trao đổi, không chứa nghiệp vụ xử lý.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyProofUploadBatchRequest {

    @NotEmpty(message = "Danh sách minh chứng không được để trống")
    @Valid
    private List<CompanyProofUploadItemRequest> minhChungs;
}

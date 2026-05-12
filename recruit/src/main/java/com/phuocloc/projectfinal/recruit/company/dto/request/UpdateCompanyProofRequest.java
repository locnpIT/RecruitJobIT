package com.phuocloc.projectfinal.recruit.company.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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

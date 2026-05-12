package com.phuocloc.projectfinal.recruit.company.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterCompanyPackageRequest {

    @NotNull(message = "Cần chọn gói")
    private Integer danhMucGoiId;
}

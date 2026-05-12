package com.phuocloc.projectfinal.recruit.admin.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReviewCompanyRequest {

    @Size(max = 2000, message = "Lý do từ chối không được quá 2000 ký tự")
    private String lyDoTuChoi;
}

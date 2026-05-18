package com.phuocloc.projectfinal.recruit.candidate.dto.request;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO nhận dữ liệu đầu vào từ client cho API UpdateKyNangUngVienRequest.
 * Chỉ chứa dữ liệu trao đổi, không chứa nghiệp vụ xử lý.
 */
@Getter
@Setter
public class UpdateKyNangUngVienRequest {
    @NotNull
    private List<Integer> kyNangIds;
}

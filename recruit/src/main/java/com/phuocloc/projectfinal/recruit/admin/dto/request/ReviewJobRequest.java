package com.phuocloc.projectfinal.recruit.admin.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * Payload admin gửi khi từ chối một tin tuyển dụng.
 * Hiện tại request này chỉ bắt buộc lý do từ chối để frontend có thể hiển thị lại cho doanh nghiệp.
 */
@Getter
@Setter
public class ReviewJobRequest {

    /**
     * Lý do nghiệp vụ khiến tin bị từ chối.
     */
    @NotBlank(message = "Vui lòng nhập lý do từ chối")
    private String lyDoTuChoi;
}

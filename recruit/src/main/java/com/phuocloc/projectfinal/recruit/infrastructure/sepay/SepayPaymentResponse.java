package com.phuocloc.projectfinal.recruit.infrastructure.sepay;

import lombok.Builder;
import lombok.Data;

/**
 * Thành phần lõi SepayPaymentResponse của hệ thống tuyển dụng.
 * Giữ vai trò hạ tầng/miền dùng chung giữa các module.
 */
@Data
@Builder
public class SepayPaymentResponse {
    
    private String paymentCode;

    private Long amount;

    private String qrImageUrl;

    private String transferContent;

}

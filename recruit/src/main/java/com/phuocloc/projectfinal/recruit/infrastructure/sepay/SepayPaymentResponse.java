package com.phuocloc.projectfinal.recruit.infrastructure.sepay;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SepayPaymentResponse {
    
    private String paymentCode;

    private Long amount;

    private String qrImageUrl;

    private String transferContent;

}

package com.phuocloc.projectfinal.recruit.infrastructure.sepay;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Thành phần lõi SepayWebhookRequest của hệ thống tuyển dụng.
 * Giữ vai trò hạ tầng/miền dùng chung giữa các module.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class SepayWebhookRequest {

    private Long id;
    private String gateway;
    private String transactionDate;

    private String accountNumber;

    private String code;

    private String content;

    private String transferType;

    private Long transferAmount;

    private Long accumulated;

    private String subAccount;

    private String referenceCode;

    private String description;
    
}

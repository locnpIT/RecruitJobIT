package com.phuocloc.projectfinal.recruit.infrastructure.sepay;

import java.util.Map;
import lombok.Builder;
import lombok.Data;

/**
 * Thành phần lõi SepayCheckoutForm của hệ thống tuyển dụng.
 * Giữ vai trò hạ tầng/miền dùng chung giữa các module.
 */
@Data
@Builder
public class SepayCheckoutForm {

    private String actionUrl;

    private Map<String, String> fields;
}

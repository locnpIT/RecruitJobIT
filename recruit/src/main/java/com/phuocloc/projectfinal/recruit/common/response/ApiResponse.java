package com.phuocloc.projectfinal.recruit.common.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Mô hình phản hồi API cho ApiResponse.
 * Giữ dữ liệu trả về ổn định để frontend tiêu thụ dễ dàng.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiResponse<T> {
    
    private boolean success;
    private String code;
    private String message;
    private T data;

    


}

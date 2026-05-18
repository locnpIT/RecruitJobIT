package com.phuocloc.projectfinal.recruit.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Mô hình phản hồi API cho ErrorDetail.
 * Giữ dữ liệu trả về ổn định để frontend tiêu thụ dễ dàng.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorDetail {

    private String field;
    private String message;
    private Object rejectedValue;
}

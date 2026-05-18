package com.phuocloc.projectfinal.recruit.chat.dto.request;

import lombok.Getter;
import lombok.Setter;

/**
 * DTO nhận dữ liệu đầu vào từ client cho API CreateChatMessageRequest.
 * Chỉ chứa dữ liệu trao đổi, không chứa nghiệp vụ xử lý.
 */
@Getter
@Setter
public class CreateChatMessageRequest {

    private String noiDung;
}

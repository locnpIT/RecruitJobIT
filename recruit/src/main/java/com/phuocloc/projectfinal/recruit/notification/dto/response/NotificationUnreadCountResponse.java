package com.phuocloc.projectfinal.recruit.notification.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * DTO trả dữ liệu từ server cho API NotificationUnreadCountResponse.
 * Giữ response rõ ràng để frontend dễ hiển thị và bảo trì.
 */
@Getter
@AllArgsConstructor
public class NotificationUnreadCountResponse {
    private Long soChuaDoc;
}

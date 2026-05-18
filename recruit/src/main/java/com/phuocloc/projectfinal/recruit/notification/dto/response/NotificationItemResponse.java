package com.phuocloc.projectfinal.recruit.notification.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

/**
 * DTO trả dữ liệu từ server cho API NotificationItemResponse.
 * Giữ response rõ ràng để frontend dễ hiển thị và bảo trì.
 */
@Getter
@Builder
public class NotificationItemResponse {
    private Long id;
    private String tieuDe;
    private String noiDung;
    private String duongDan;
    private Boolean daDoc;
    private LocalDateTime ngayTao;
}

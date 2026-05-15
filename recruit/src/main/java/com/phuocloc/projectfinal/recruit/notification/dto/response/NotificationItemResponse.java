package com.phuocloc.projectfinal.recruit.notification.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

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

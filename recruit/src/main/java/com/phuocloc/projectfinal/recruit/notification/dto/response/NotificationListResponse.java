package com.phuocloc.projectfinal.recruit.notification.dto.response;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NotificationListResponse {
    private List<NotificationItemResponse> items;
    private Integer page;
    private Integer size;
    private Long totalElements;
    private Integer totalPages;
    private Boolean hasNext;
}

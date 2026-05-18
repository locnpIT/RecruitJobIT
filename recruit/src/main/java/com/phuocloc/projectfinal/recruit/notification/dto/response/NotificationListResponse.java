package com.phuocloc.projectfinal.recruit.notification.dto.response;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

/**
 * DTO trả dữ liệu từ server cho API NotificationListResponse.
 * Giữ response rõ ràng để frontend dễ hiển thị và bảo trì.
 */
@Getter
@Builder
public class NotificationListResponse {
    private List<NotificationItemResponse> danhSach;
    private Integer trang;
    private Integer kichThuoc;
    private Long tongPhanTu;
    private Integer tongSoTrang;
    private Boolean conTrangSau;
}

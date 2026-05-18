package com.phuocloc.projectfinal.recruit.admin.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO trả dữ liệu từ server cho API AdminPackageSubscriptionResponse.
 * Giữ response rõ ràng để frontend dễ hiển thị và bảo trì.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminPackageSubscriptionResponse {
    private Long id;
    private String congTy;
    private String goi;
    private String trangThai;
    private String trangThaiThanhToan;
    private LocalDateTime batDauLuc;
    private LocalDateTime hetHanLuc;
    private BigDecimal giaTaiThoiDiemDangKy;
    private LocalDateTime ngayTao;
    private Boolean coHieuLuc;
}

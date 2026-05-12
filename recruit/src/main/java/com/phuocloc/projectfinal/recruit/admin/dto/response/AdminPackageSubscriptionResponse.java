package com.phuocloc.projectfinal.recruit.admin.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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

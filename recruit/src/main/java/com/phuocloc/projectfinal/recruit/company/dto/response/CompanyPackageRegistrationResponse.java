package com.phuocloc.projectfinal.recruit.company.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyPackageRegistrationResponse {
    private Long id;
    private Long congTyId;
    private Long danhMucGoiId;
    private String maGoi;
    private String tenGoi;
    private String trangThai;
    private String trangThaiThanhToan;
    private LocalDateTime batDauLuc;
    private LocalDateTime hetHanLuc;
    private BigDecimal giaTaiThoiDiemDangKy;
    private LocalDateTime ngayTao;
    private Boolean coHieuLuc;
    private String paymentGateway;
    private String paymentCode;
    private String transferContent;
    private String qrImageUrl;
    private String checkoutFormAction;
    private Map<String, String> checkoutFormFields;
}

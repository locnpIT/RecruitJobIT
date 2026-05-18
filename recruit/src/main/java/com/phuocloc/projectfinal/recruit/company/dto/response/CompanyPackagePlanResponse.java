package com.phuocloc.projectfinal.recruit.company.dto.response;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO trả dữ liệu từ server cho API CompanyPackagePlanResponse.
 * Giữ response rõ ràng để frontend dễ hiển thị và bảo trì.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyPackagePlanResponse {
    private Long id;
    private String maGoi;
    private String tenGoi;
    private String moTa;
    private BigDecimal giaNiemYet;
    private Integer soNgayHieuLuc;
}

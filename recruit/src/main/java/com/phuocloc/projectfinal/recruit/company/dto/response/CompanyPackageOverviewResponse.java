package com.phuocloc.projectfinal.recruit.company.dto.response;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO trả dữ liệu từ server cho API CompanyPackageOverviewResponse.
 * Giữ response rõ ràng để frontend dễ hiển thị và bảo trì.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyPackageOverviewResponse {
    private List<CompanyPackagePlanResponse> danhSachGoi;
    private CompanyPackageRegistrationResponse goiHienTai;
    private Boolean coQuyenDangBai;
}

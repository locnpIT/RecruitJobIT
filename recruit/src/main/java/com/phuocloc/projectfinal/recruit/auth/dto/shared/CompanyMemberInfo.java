package com.phuocloc.projectfinal.recruit.auth.dto.shared;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Thành phần lõi CompanyMemberInfo của hệ thống tuyển dụng.
 * Giữ vai trò hạ tầng/miền dùng chung giữa các module.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyMemberInfo {
    private Integer congTyId;
    private Integer chiNhanhId;
    private String vaiTroCongTy; // OWNER, HR
}

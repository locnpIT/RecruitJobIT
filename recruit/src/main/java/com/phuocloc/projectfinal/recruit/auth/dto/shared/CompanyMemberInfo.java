package com.phuocloc.projectfinal.recruit.auth.dto.shared;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyMemberInfo {
    private Integer companyId;
    private Integer branchId;
    private String companyRole; // OWNER, MASTER_BRANCH, HR
}

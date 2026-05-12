package com.phuocloc.projectfinal.recruit.company.dto.response.companyadmin;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import com.phuocloc.projectfinal.recruit.auth.dto.shared.CompanyMemberInfo;

@Data
@Builder
public class CompanyAdminMeResponse {
    private Long userId;
    private String email;
    private String systemRole;
    private List<CompanyMemberInfo> memberships;
}

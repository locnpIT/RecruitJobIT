package com.phuocloc.projectfinal.recruit.company.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateEmployerResponse {

    private Long employerProfileId;
    private Long userId;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private Long companyId;
    private Long branchId;
    private String companyRole;
    private Boolean isActive;
}

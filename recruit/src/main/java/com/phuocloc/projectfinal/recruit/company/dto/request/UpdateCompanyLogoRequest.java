package com.phuocloc.projectfinal.recruit.company.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateCompanyLogoRequest {

    private String logoUrl;
}

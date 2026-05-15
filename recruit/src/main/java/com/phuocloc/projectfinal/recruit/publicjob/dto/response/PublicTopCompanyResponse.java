package com.phuocloc.projectfinal.recruit.publicjob.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PublicTopCompanyResponse {

    private Long id;
    private String ten;
    private String logoUrl;
}

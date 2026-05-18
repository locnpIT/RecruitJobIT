package com.phuocloc.projectfinal.recruit.publicjob.dto.response;

import lombok.Builder;
import lombok.Getter;

/**
 * DTO chi tiết công ty cho trang public company profile.
 */
@Getter
@Builder
public class PublicCompanyDetailResponse {

    private Long id;
    private String ten;
    private String logoUrl;
    private String website;
    private String moTa;
    private Long soTinDang;
}


package com.phuocloc.projectfinal.recruit.publicjob.dto.response;

import java.util.List;
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
    private List<BranchItem> chiNhanhs;

    @Getter
    @Builder
    public static class BranchItem {
        private Long id;
        private String ten;
        private String diaChi;
        private boolean laTruSoChinh;
    }
}

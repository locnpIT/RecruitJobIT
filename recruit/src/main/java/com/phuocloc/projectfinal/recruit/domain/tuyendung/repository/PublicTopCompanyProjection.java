package com.phuocloc.projectfinal.recruit.domain.tuyendung.repository;

/**
 * Repository truy cập dữ liệu cho PublicTopCompanyProjection.
 * Định nghĩa truy vấn phục vụ các luồng nghiệp vụ của hệ thống.
 */
public interface PublicTopCompanyProjection {

    Integer getCompanyId();

    String getCompanyName();

    String getLogoUrl();

    Long getActiveJobCount();
}

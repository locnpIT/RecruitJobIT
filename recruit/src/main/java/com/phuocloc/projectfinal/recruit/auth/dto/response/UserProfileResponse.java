package com.phuocloc.projectfinal.recruit.auth.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserProfileResponse {
    private Long id;
    private String email;
    private String ten;
    private String ho;
    private String soDienThoai;
    private String vaiTro;
    private Boolean dangHoatDong;
    private String anhDaiDienUrl;
}

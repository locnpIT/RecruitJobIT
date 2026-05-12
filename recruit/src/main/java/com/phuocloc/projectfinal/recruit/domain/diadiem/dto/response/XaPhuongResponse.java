package com.phuocloc.projectfinal.recruit.domain.diadiem.dto.response;

import lombok.Builder;

@Builder
public record XaPhuongResponse(
        Long id,
        String ten,
        String moTa,
        Long tinhThanhId,
        String tinhThanhTen
) {
}

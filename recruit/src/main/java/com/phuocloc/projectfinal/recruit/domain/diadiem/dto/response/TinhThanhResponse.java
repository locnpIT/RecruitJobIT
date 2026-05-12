package com.phuocloc.projectfinal.recruit.domain.diadiem.dto.response;

import lombok.Builder;

@Builder
public record TinhThanhResponse(
        Long id,
        String ten,
        String moTa
) {
}

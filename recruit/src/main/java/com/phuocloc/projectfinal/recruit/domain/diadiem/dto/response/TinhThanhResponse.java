package com.phuocloc.projectfinal.recruit.domain.diadiem.dto.response;

import lombok.Builder;

/**
 * DTO trả dữ liệu từ server cho API TinhThanhResponse.
 * Giữ response rõ ràng để frontend dễ hiển thị và bảo trì.
 */
@Builder
public record TinhThanhResponse(
        Long id,
        String ten,
        String moTa
) {
}

package com.phuocloc.projectfinal.recruit.publicjob.dto.response;

import lombok.Builder;
import lombok.Getter;

/**
 * DTO trả dữ liệu từ server cho API FavoriteJobStatusResponse.
 * Giữ response rõ ràng để frontend dễ hiển thị và bảo trì.
 */
@Getter
@Builder
public class FavoriteJobStatusResponse {

    private Long tinTuyenDungId;
    private Boolean daYeuThich;
}

package com.phuocloc.projectfinal.recruit.publicjob.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FavoriteJobStatusResponse {

    private Long tinTuyenDungId;
    private Boolean daYeuThich;
}

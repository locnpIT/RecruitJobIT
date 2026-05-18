package com.phuocloc.projectfinal.recruit.candidate.dto.response;

import lombok.Builder;
import lombok.Getter;

/**
 * DTO trả dữ liệu từ server cho API CandidateJobApplicationStatusResponse.
 * Giữ response rõ ràng để frontend dễ hiển thị và bảo trì.
 */
@Getter
@Builder
public class CandidateJobApplicationStatusResponse {

    private Long tinTuyenDungId;
    private Boolean daUngTuyen;
    private CandidateJobApplicationResponse donUngTuyen;
}

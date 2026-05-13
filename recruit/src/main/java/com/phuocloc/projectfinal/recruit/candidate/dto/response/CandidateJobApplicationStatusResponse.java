package com.phuocloc.projectfinal.recruit.candidate.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CandidateJobApplicationStatusResponse {

    private Long jobId;
    private Boolean applied;
    private CandidateJobApplicationResponse application;
}

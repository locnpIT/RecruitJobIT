package com.phuocloc.projectfinal.recruit.candidate.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ProfileItemSelectionResponse {
    private Long profileId;
    private Long itemId;
    private String loai;
    private Boolean duocChon;
}


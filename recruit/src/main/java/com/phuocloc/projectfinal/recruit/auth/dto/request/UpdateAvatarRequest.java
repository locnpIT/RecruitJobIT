package com.phuocloc.projectfinal.recruit.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateAvatarRequest {

    @NotBlank
    private String anhDaiDienUrl;
}

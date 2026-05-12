package com.phuocloc.projectfinal.recruit.candidate.dto.request;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateKyNangUngVienRequest {
    @NotNull
    private List<Integer> kyNangIds;
}

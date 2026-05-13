package com.phuocloc.projectfinal.recruit.candidate.dto.request;

import lombok.Data;

@Data
public class CreateJobApplicationRequest {

    private Long hoSoUngVienId;
    private String cvUrl;
}

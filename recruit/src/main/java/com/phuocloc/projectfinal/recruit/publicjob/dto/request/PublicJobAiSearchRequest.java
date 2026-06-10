package com.phuocloc.projectfinal.recruit.publicjob.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PublicJobAiSearchRequest {

    @NotBlank(message = "Prompt tìm kiếm không được để trống")
    @Size(max = 500, message = "Prompt tìm kiếm tối đa 500 ký tự")
    private String prompt;

    private Integer gioiHan;

    private Integer trang;
}

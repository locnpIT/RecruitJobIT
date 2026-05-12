package com.phuocloc.projectfinal.recruit.candidate.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CandidateProfileListItemResponse {
    private Long id;
    private String title;
    private String mucTieuNgheNghiep;
    private String gioiThieuBanThan;
    private LocalDateTime ngayCapNhat;
}

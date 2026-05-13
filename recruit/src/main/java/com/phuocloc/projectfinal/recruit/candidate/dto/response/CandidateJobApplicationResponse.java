package com.phuocloc.projectfinal.recruit.candidate.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CandidateJobApplicationResponse {

    private Long id;
    private Long tinTuyenDungId;
    private String tieuDeTinTuyenDung;
    private Long hoSoUngVienId;
    private String trangThai;
    private String cvUrl;
    private Boolean batBuocCv;
    private String mauCvUrl;
    private LocalDateTime ngayTao;
}

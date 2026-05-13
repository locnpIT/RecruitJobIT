package com.phuocloc.projectfinal.recruit.publicjob.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PublicJobSummaryResponse {

    private Long id;
    private String maTin;
    private String tieuDe;
    private String congTyTen;
    private String diaDiem;
    private String mucLuong;
    private String capDo;
    private String hinhThuc;
    private String nganhNghe;
    private String hanNop;
    private String tag;
    private LocalDateTime ngayTao;
}

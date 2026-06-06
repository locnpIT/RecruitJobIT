package com.phuocloc.projectfinal.recruit.publicjob.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

/**
 * DTO trả dữ liệu từ server cho API PublicJobSummaryResponse.
 * Giữ response rõ ràng để frontend dễ hiển thị và bảo trì.
 */
@Getter
@Builder
public class PublicJobSummaryResponse {

    private Long id;
    private String maTin;
    private String tieuDe;
    private Long congTyId;
    private String congTyTen;
    private Long chiNhanhId;
    private String chiNhanhTen;
    private String logoUrl;
    private String diaDiem;
    private String mucLuong;
    private String capDo;
    private String hinhThuc;
    private String nganhNghe;
    private String hanNop;
    private LocalDateTime ngayTao;
}

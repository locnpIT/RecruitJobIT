package com.phuocloc.projectfinal.recruit.candidate.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

/**
 * DTO trả dữ liệu từ server cho API CandidateProfileListItemResponse.
 * Giữ response rõ ràng để frontend dễ hiển thị và bảo trì.
 */
@Getter
@Builder
public class CandidateProfileListItemResponse {
    private Long id;
    private String tieuDe;
    private String mucTieuNgheNghiep;
    private String gioiThieuBanThan;
    private LocalDateTime ngayCapNhat;
}

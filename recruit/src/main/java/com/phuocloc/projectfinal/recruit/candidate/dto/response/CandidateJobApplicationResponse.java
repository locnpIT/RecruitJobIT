package com.phuocloc.projectfinal.recruit.candidate.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

/**
 * DTO trả dữ liệu từ server cho API CandidateJobApplicationResponse.
 * Giữ response rõ ràng để frontend dễ hiển thị và bảo trì.
 */
@Getter
@Builder
public class CandidateJobApplicationResponse {

    private Long id;
    private Long tinTuyenDungId;
    private String tieuDeTinTuyenDung;
    private Long hoSoUngVienId;
    private String trangThai;
    private String cvUrl;
    private Boolean batBuocCV;
    private String mauCvUrl;
    private LocalDateTime ngayTao;
}

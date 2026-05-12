package com.phuocloc.projectfinal.recruit.company.dto.response;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyAdminProofResponse {

    private Long id;
    private String tenTep;
    private String duongDanTep;
    private String loaiTaiLieu;
    private String trangThai;
    private String lyDoTuChoi;
    private LocalDateTime ngayTao;
}

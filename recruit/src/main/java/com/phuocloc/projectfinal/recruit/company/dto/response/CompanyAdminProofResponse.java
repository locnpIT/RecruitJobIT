package com.phuocloc.projectfinal.recruit.company.dto.response;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO trả dữ liệu từ server cho API CompanyAdminProofResponse.
 * Giữ response rõ ràng để frontend dễ hiển thị và bảo trì.
 */
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

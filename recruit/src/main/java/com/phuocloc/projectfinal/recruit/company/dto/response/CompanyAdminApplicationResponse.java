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
public class CompanyAdminApplicationResponse {

    private Long id;
    private String trangThai;
    private String cvUrl;
    private LocalDateTime ngayTao;
    private Long chiNhanhId;
    private String chiNhanhTen;
    private Long congTyId;
    private String congTyTen;
    private Long tinTuyenDungId;
    private String tieuDeTinTuyenDung;
    private Long nguoiDungId;
    private String ungVienHoTen;
    private String ungVienEmail;
}

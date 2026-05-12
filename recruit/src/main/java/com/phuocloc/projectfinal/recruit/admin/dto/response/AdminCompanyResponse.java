package com.phuocloc.projectfinal.recruit.admin.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminCompanyResponse {

    private Long id;
    private String ten;
    private String maSoThue;
    private String website;
    private String trangThai;
    private String lyDoTuChoi;
    private String chuCongTyHoTen;
    private String chuCongTyEmail;
    private Integer soChiNhanh;
    private String minhChungUrl;
    private String minhChungTrangThai;
    private String minhChungLyDoTuChoi;
    private LocalDateTime ngayTao;
    private LocalDateTime ngayCapNhat;
}

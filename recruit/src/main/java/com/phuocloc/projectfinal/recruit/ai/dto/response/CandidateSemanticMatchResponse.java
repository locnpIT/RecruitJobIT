package com.phuocloc.projectfinal.recruit.ai.dto.response;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO trả về ứng viên/hồ sơ phù hợp với một tin tuyển dụng.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidateSemanticMatchResponse {

    private Long hoSoUngVienId;
    private Long nguoiDungId;
    private String tenHoSo;
    private String ungVienHoTen;
    private String email;
    private String soDienThoai;
    private String anhDaiDienUrl;
    private String mucTieuNgheNghiep;
    private String gioiThieuBanThan;
    private Double diemPhuHop;
    private List<String> tinHieuKhop;
    private List<String> canKiemTraThem;
}

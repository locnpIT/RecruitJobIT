package com.phuocloc.projectfinal.recruit.ai.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO trả về tin tuyển dụng phù hợp với một hồ sơ ứng viên.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobSemanticMatchResponse {

    private Long tinTuyenDungId;
    private String tieuDe;
    private String trangThai;
    private String congTyTen;
    private String congTyLogoUrl;
    private String chiNhanhTen;
    private String diaDiem;
    private String nganhNghe;
    private String loaiHinhLamViec;
    private String capDoKinhNghiem;
    private LocalDateTime denHanLuc;
    private Double diemPhuHop;
    private List<String> tinHieuKhop;
    private List<String> canKiemTraThem;
}

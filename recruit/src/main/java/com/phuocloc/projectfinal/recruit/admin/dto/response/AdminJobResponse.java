package com.phuocloc.projectfinal.recruit.admin.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

/**
 * DTO tóm tắt một tin tuyển dụng trong màn duyệt tin của admin.
 * Đây là shape dữ liệu tối ưu cho bảng danh sách, không chứa toàn bộ nội dung chi tiết.
 */
@Getter
@Builder
public class AdminJobResponse {

    /**
     * ID duy nhất của tin tuyển dụng.
     */
    private Long id;

    /**
     * Tiêu đề tin hiển thị ở cột đầu tiên và dùng để điều hướng sang detail.
     */
    private String tieuDe;
    private String congTyTen;
    private String chiNhanhTen;
    private String diaDiem;
    private String nganhNgheTen;
    private String capDoKinhNghiemTen;
    private Integer luongToiThieu;
    private Integer luongToiDa;
    private String trangThai;
    private String lyDoTuChoi;
    private LocalDateTime denHanLuc;
    private LocalDateTime ngayTao;

}

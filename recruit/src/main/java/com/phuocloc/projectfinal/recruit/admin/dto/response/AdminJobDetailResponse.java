package com.phuocloc.projectfinal.recruit.admin.dto.response;

import lombok.Getter;
import lombok.Setter;

/**
 * DTO chi tiết cho màn admin xem nội dung đầy đủ của một tin tuyển dụng.
 * Tách riêng khỏi `AdminJobResponse` để list page không phải tải các field dài.
 */
@Getter
@Setter
public class AdminJobDetailResponse {

    /**
     * Phần tóm tắt dùng chung với bảng danh sách.
     */
    private AdminJobResponse summary;

    /**
     * Các field nội dung dài chỉ cần khi mở drawer/modal chi tiết.
     */
    private String moTa;
    private String yeuCau;
    private String phucLoi;
    private Boolean batBuocCv;
    private String mauCvUrl;

}

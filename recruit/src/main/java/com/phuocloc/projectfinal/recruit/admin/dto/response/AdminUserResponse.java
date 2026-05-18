package com.phuocloc.projectfinal.recruit.admin.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

/**
 * DTO trả dữ liệu từ server cho API AdminUserResponse.
 * Giữ response rõ ràng để frontend dễ hiển thị và bảo trì.
 */
@Data
@Builder
public class AdminUserResponse {

    private Long id;
    private String hoTen;
    private String email;
    private String soDienThoai;
    private String vaiTroHeThong;
    private Boolean dangHoatDong;
    private String trangThai;
    private String congTyTen;
    private String vaiTroCongTy;
    private String chiNhanhTen;
    private LocalDateTime ngayTao;
    private LocalDateTime ngayCapNhat;
}

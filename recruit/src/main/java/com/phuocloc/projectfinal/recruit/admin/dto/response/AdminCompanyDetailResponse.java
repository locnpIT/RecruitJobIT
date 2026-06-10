package com.phuocloc.projectfinal.recruit.admin.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Data;

/**
 * DTO trả dữ liệu từ server cho API AdminCompanyDetailResponse.
 * Giữ response rõ ràng để frontend dễ hiển thị và bảo trì.
 */
@Data
@Builder
public class AdminCompanyDetailResponse {

    private AdminCompanyResponse congTy;
    private Owner chuCongTy;
    private List<Branch> chiNhanhs;
    private List<ProofDocument> taiLieuMinhChungs;

    @Data
    @Builder
    public static class Owner {
        private Long id;
        private String hoTen;
        private String email;
        private String soDienThoai;
        private Boolean dangHoatDong;
    }

    @Data
    @Builder
    public static class Branch {
        private Long id;
        private String ten;
        private String diaChiChiTiet;
        private Long xaPhuongId;
        private String xaPhuongTen;
        private Long tinhThanhId;
        private String tinhThanhTen;
        private Boolean laTruSoChinh;
        private String trangThai;
        private LocalDateTime ngayTao;
    }

    @Data
    @Builder
    public static class ProofDocument {
        private Long id;
        private String tenTep;
        private String duongDanTep;
        private String loaiTaiLieu;
        private String trangThai;
        private String lyDoTuChoi;
        private LocalDateTime ngayTao;
    }
}

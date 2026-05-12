package com.phuocloc.projectfinal.recruit.admin.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminCompanyDetailResponse {

    private AdminCompanyResponse company;
    private Owner owner;
    private List<Branch> branches;
    private List<ProofDocument> proofDocuments;

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
        private String xaPhuongTen;
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

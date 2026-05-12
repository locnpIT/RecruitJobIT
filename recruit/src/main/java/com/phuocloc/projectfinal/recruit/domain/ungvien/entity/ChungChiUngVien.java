package com.phuocloc.projectfinal.recruit.domain.ungvien.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "ChungChiUngVien")
@Data
@NoArgsConstructor
@AllArgsConstructor
/**
 * Entity lưu thông tin chứng chỉ của ứng viên trong một hồ sơ cụ thể.
 *
 * <p>Mỗi bản ghi đại diện cho một chứng chỉ riêng:
 * tên chứng chỉ, loại chứng chỉ, thời gian hiệu lực và đường dẫn minh chứng đã upload.</p>
 */
public class ChungChiUngVien {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Hồ sơ ứng viên sở hữu chứng chỉ này.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hoSoUngVienId")
    private HoSoUngVien hoSoUngVien;

    // Loại chứng chỉ để phục vụ phân loại và hiển thị trên UI.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loaiChungChiId")
    private LoaiChungChi loaiChungChi;

    // Tên chứng chỉ thực tế, ví dụ: IELTS 7.0, AWS Solutions Architect...
    @Column(name = "tenChungChi")
    private String tenChungChi;

    // Ngày cấp/ngày bắt đầu có hiệu lực.
    @Column(name = "ngayBatDau")
    private LocalDate ngayBatDau;

    // Ngày hết hạn nếu chứng chỉ có thời hạn.
    @Column(name = "ngayHetHan")
    private LocalDate ngayHetHan;

    // URL minh chứng đã upload lên Cloudinary hoặc hệ thống lưu trữ file khác.
    @Column(name = "duongDanTep")
    private String duongDanTep;

    // Trạng thái nội bộ nếu hệ thống cần đánh dấu chứng chỉ còn hiệu lực/hết hạn/ẩn...
    @Column(name = "trangThai")
    private String trangThai;
}

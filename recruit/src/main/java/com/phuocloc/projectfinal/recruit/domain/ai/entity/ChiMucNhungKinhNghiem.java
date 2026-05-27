package com.phuocloc.projectfinal.recruit.domain.ai.entity;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.KinhNghiemLamViecUngVien;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

/**
 * Lưu trạng thái đồng bộ embedding của từng kinh nghiệm làm việc vào Qdrant.
 * Mỗi lần sync tạo 1 dòng mới (append-only log), dùng findFirst...OrderByIdDesc để lấy trạng thái mới nhất.
 */
@Entity
@Table(name = "ChiMucNhungKinhNghiem")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChiMucNhungKinhNghiem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kinhNghiemId")
    private KinhNghiemLamViecUngVien kinhNghiem;

    /** UUID point trong Qdrant collection khoKinhNghiem. */
    @Column(name = "maDiem")
    private String maDiem;

    /** INDEXED | ERROR | DEACTIVATED */
    @Column(name = "trangThai")
    private String trangThai;

    @Column(name = "ngayTao")
    private LocalDateTime ngayTao;
}

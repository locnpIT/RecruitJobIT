package com.phuocloc.projectfinal.recruit.domain.ai.entity;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoUngVien;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

/**
 * Entity ánh xạ dữ liệu cho ChiMucNhungHoSoUngVien.
 * Dùng bởi JPA để đọc/ghi dữ liệu tương ứng trong cơ sở dữ liệu.
 */
@Entity
@Table(name = "ChiMucNhungHoSoUngVien")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChiMucNhungHoSoUngVien {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hoSoUngVienId")
    private HoSoUngVien hoSoUngVien;

    @Column(name = "maDiem")
    private String maDiem;

    @Column(name = "trangThai")
    private String trangThai;

    @Column(name = "ngayTao")
    private LocalDateTime ngayTao;
}

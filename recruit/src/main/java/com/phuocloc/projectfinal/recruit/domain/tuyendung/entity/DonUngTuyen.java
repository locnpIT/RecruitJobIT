package com.phuocloc.projectfinal.recruit.domain.tuyendung.entity;

import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoUngVien;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "DonUngTuyen")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DonUngTuyen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @CreationTimestamp
    @Column(name = "ngayTao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;

    @UpdateTimestamp
    @Column(name = "ngayCapNhat", nullable = false)
    private LocalDateTime ngayCapNhat;

    @Column(name = "ngayXoa")
    private LocalDateTime ngayXoa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tinTuyenDungId")
    private TinTuyenDung tinTuyenDung;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hoSoUngVienId")
    private HoSoUngVien hoSoUngVien;

    @Column(name = "trangThai")
    private String trangThai;

    @Column(name = "cvUrl")
    private String cvUrl;
}

package com.phuocloc.projectfinal.recruit.domain.chat.entity;

import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "CuocTroChuyen")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CuocTroChuyen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @CreationTimestamp
    @Column(name = "ngayTao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ungVienId")
    private NguoiDung ungVien;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nhaTuyenDungId")
    private NguoiDung nhaTuyenDung;
}

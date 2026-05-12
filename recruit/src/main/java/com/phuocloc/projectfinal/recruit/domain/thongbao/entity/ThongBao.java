package com.phuocloc.projectfinal.recruit.domain.thongbao.entity;

import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "ThongBao")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ThongBao {

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
    @JoinColumn(name = "nguoiDungId")
    private NguoiDung nguoiDung;

    @Column(name = "tieuDe")
    private String tieuDe;

    @Column(name = "noiDung", columnDefinition = "TEXT")
    private String noiDung;

    @Column(name = "daDoc")
    private Boolean daDoc;
}

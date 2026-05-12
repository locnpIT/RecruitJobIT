package com.phuocloc.projectfinal.recruit.domain.chat.entity;

import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "TinNhan")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TinNhan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @CreationTimestamp
    @Column(name = "ngayTao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cuocTroChuyenId")
    private CuocTroChuyen cuocTroChuyen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nguoiGuiId")
    private NguoiDung nguoiGui;

    @Column(name = "noiDung", columnDefinition = "TEXT")
    private String noiDung;

    @Column(name = "daDoc")
    private Boolean daDoc;
}

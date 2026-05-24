package com.phuocloc.projectfinal.recruit.domain.ai.entity;

import com.phuocloc.projectfinal.recruit.domain.tuyendung.entity.TinTuyenDung;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity ánh xạ dữ liệu cho ChiMucNhungTinTuyenDung.
 * Dùng bởi JPA để đọc/ghi dữ liệu tương ứng trong cơ sở dữ liệu.
 */
@Entity
@Table(name = "ChiMucNhungTinTuyenDung")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChiMucNhungTinTuyenDung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tinTuyenDungId")
    private TinTuyenDung tinTuyenDung;

    @Column(name = "maDiem")
    private String maDiem;

    @Column(name = "trangThai")
    private String trangThai;

    @Column(name = "ngayTao")
    private LocalDateTime ngayTao;
}

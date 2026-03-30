package com.phuocloc.projectfinal.recruit.company.entity;

import com.phuocloc.projectfinal.recruit.common.entity.BaseEntity;
import com.phuocloc.projectfinal.recruit.company.enums.CompanyProofDocumentStatus;
import com.phuocloc.projectfinal.recruit.company.enums.CompanyProofDocumentType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "tepMinhChungCongTy")
public class CompanyProofDocument extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "congTyId", nullable = false)
    private Company company;

    @Column(name = "duongDanTep", nullable = false, length = 10000)
    private String fileUrl;

    @Column(name = "tenTep", nullable = false, length = 255)
    private String fileName;

    @Column(name = "loaiTep", length = 100)
    private String fileType;

    @Column(name = "kichThuocTep")
    private Long fileSize;

    @Enumerated(EnumType.STRING)
    @Column(name = "loaiTaiLieu", nullable = false, length = 30)
    private CompanyProofDocumentType documentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "trangThai", nullable = false, length = 20)
    @Builder.Default
    private CompanyProofDocumentStatus status = CompanyProofDocumentStatus.PENDING;

    @Column(name = "lyDoTuChoi", length = 500)
    private String rejectReason;

    @Column(name = "duyetLuc")
    private LocalDateTime reviewedAt;
}

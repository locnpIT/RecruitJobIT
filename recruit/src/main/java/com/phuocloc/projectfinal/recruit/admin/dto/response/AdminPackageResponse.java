package com.phuocloc.projectfinal.recruit.admin.dto.response;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminPackageResponse {
    private Long id;
    private String maGoi;
    private String tenGoi;
    private String moTa;
    private BigDecimal giaNiemYet;
    private Integer soNgayHieuLuc;
    private Long soCongTyDangSuDung;
}

package com.phuocloc.projectfinal.recruit.publicjob.dto.response;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

/**
 * DTO phân trang cho API search public jobs.
 */
@Getter
@Builder
public class PublicJobSearchResponse {

    private List<PublicJobSummaryResponse> danhSach;
    private long tongSo;
    private int trang;
    private int kichThuoc;
    private boolean conTrangSau;
}

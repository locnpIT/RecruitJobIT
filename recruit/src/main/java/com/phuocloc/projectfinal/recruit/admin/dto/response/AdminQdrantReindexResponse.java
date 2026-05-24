package com.phuocloc.projectfinal.recruit.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response tổng hợp thao tác reindex dữ liệu semantic lên Qdrant.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminQdrantReindexResponse {

    private boolean enabled;
    private String jobCollection;
    private String candidateProfileCollection;
    private int tongTinTuyenDung;
    private int soTinTuyenDungDaDongBo;
    private int soTinTuyenDungThatBai;
    private int tongHoSoUngVien;
    private int soHoSoUngVienDaDongBo;
    private int soHoSoUngVienThatBai;
}

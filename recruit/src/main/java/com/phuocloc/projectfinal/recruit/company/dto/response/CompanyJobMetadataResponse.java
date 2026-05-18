package com.phuocloc.projectfinal.recruit.company.dto.response;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

/**
 * DTO trả dữ liệu từ server cho API CompanyJobMetadataResponse.
 * Giữ response rõ ràng để frontend dễ hiển thị và bảo trì.
 */
@Getter
@Builder
public class CompanyJobMetadataResponse {

    private List<OptionItem> nganhNghes;
    private List<OptionItem> loaiHinhLamViecs;
    private List<OptionItem> capDoKinhNghiems;
    private List<OptionItem> kyNangs;

    @Getter
    @Builder
    public static class OptionItem {
        private Long id;
        private String ten;
    }
}

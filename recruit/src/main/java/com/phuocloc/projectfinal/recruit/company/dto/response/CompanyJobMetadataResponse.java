package com.phuocloc.projectfinal.recruit.company.dto.response;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

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

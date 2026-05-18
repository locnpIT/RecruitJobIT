package com.phuocloc.projectfinal.recruit.publicjob.dto.response;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

/**
 * DTO danh mục filter cho trang search việc làm public.
 */
@Getter
@Builder
public class PublicJobSearchMetadataResponse {

    private List<OptionItem> nganhNghes;
    private List<OptionItem> loaiHinhLamViecs;
    private List<OptionItem> capDoKinhNghiems;

    @Getter
    @Builder
    public static class OptionItem {
        private Long id;
        private String ten;
    }
}

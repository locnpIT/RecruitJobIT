package com.phuocloc.projectfinal.recruit.admin.dto.response;

import lombok.Builder;
import lombok.Getter;

/**
 * Kết quả reindex riêng cho kinh nghiệm làm việc lên Qdrant.
 */
@Getter
@Builder
public class AdminQdrantExperienceReindexResponse {

    private boolean enabled;
    private String experienceCollection;
    private int tongKinhNghiem;
    private int soDaDongBo;
    private int soThatBai;
}

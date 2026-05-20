package com.phuocloc.projectfinal.recruit.admin.dto.response;

import lombok.Builder;
import lombok.Getter;

/**
 * Kết quả reindex Elasticsearch theo đợt.
 */
@Getter
@Builder
public class AdminElasticsearchReindexResponse {
    private boolean enabled;
    private String jobIndex;
    private int tongTinPublic;
    private int soDaDongBo;
    private int soThatBai;
}

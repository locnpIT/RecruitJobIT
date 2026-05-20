package com.phuocloc.projectfinal.recruit.admin.dto.response;

import lombok.Builder;
import lombok.Getter;

/**
 * Dữ liệu health Elasticsearch cho trang vận hành admin.
 */
@Getter
@Builder
public class AdminElasticsearchHealthResponse {
    private boolean enabled;
    private boolean reachable;
    private String url;
    private String jobIndex;
    private String clusterName;
    private String nodeName;
    private String version;
    private String error;
}

package com.phuocloc.projectfinal.recruit.infrastructure.elasticsearch;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

/**
 * Kết quả search chuẩn hóa từ Elasticsearch để service nghiệp vụ không phụ thuộc JSON raw.
 */
@Getter
@Builder
public class ElasticsearchSearchResult {

    private List<String> documentIds;
    private long total;
}

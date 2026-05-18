package com.phuocloc.projectfinal.recruit.infrastructure.elasticsearch;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Cấu hình kết nối Elasticsearch cho module search tin tuyển dụng.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.elasticsearch")
public class ElasticsearchProperties {

    // Bật/tắt toàn bộ luồng search + indexing mà không cần sửa code.
    private boolean enabled = false;
    // URL Elasticsearch endpoint, ví dụ: http://localhost:9200.
    private String url = "http://localhost:9200";
    // API key (nếu dùng security theo kiểu ApiKey).
    private String apiKey;
    // Basic auth username (nếu cluster dùng basic auth).
    private String username;
    // Basic auth password.
    private String password;
    // Timeout gọi HTTP API của Elasticsearch.
    private int timeoutMillis = 5000;
    // Index chứa dữ liệu public jobs phục vụ search.
    private String jobIndex = "public_job_search";
}

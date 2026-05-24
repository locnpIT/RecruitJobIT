package com.phuocloc.projectfinal.recruit.infrastructure.embedding;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Cấu hình gọi microservice Python embedding cho hệ thống.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.embedding")
public class EmbeddingProperties {

    private final Python python = new Python();

    @Getter
    @Setter
    public static class Python {
        /**
         * Base URL của microservice Python embedding.
         */
        private String baseUrl = "http://localhost:8001";
        /**
         * Timeout gọi HTTP (ms).
         */
        private int timeoutMillis = 15000;
    }
}

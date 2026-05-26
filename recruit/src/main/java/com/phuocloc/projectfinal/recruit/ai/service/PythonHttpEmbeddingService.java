package com.phuocloc.projectfinal.recruit.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.phuocloc.projectfinal.recruit.infrastructure.embedding.EmbeddingProperties;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * HTTP client gọi microservice Python để lấy embedding.
 */
@Service
@Primary
@RequiredArgsConstructor
@Slf4j
public class PythonHttpEmbeddingService implements TextEmbeddingService {

    private final EmbeddingProperties embeddingProperties;
    private final ObjectMapper objectMapper;

    private volatile HttpClient httpClient;

    @Override
    public List<Float> generateVector(String noiDung) {
        String baseUrl = normalizeBaseUrl(embeddingProperties.getPython().getBaseUrl());
        String body = toJsonBody(noiDung);
        if (log.isDebugEnabled()) {
            log.debug("Embedding request -> {}/embed payload_len={} preview={}",
                    baseUrl,
                    body == null ? 0 : body.length(),
                    safePreview(body, 220));
        }
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/embed"))
                .timeout(Duration.ofMillis(Math.max(embeddingProperties.getPython().getTimeoutMillis(), 1000)))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                .build();
        try {
            HttpResponse<String> response = getHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Embedding Python trả về status=" + response.statusCode()
                        + ", resp_body=" + response.body()
                        + ", req_preview=" + safePreview(body, 220));
            }
            return parseVector(response.body());
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Gọi embedding Python bị gián đoạn", ex);
        } catch (IOException ex) {
            throw new IllegalStateException("Không gọi được embedding Python", ex);
        }
    }

    private String toJsonBody(String noiDung) {
        try {
            return objectMapper.writeValueAsString(
                    java.util.Map.of("text", StringUtils.hasText(noiDung) ? noiDung : "Nội dung chưa cập nhật")
            );
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Không serialize được payload gọi embedding Python", ex);
        }
    }

    private List<Float> parseVector(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode vectorNode = root.path("vector");
            if (!vectorNode.isArray()) {
                throw new IllegalStateException("Response /embed thiếu trường vector");
            }
            List<Float> vector = new ArrayList<>(vectorNode.size());
            for (JsonNode node : vectorNode) {
                vector.add((float) node.asDouble());
            }
            return vector;
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Không parse được response embedding Python", ex);
        }
    }

    private String normalizeBaseUrl(String rawUrl) {
        if (!StringUtils.hasText(rawUrl)) {
            throw new IllegalStateException("app.embedding.python.base-url chưa được cấu hình");
        }
        String normalized = rawUrl.trim();
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private String safePreview(String value, int maxChars) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        String normalized = value.replace('\n', ' ').replace('\r', ' ').trim();
        if (normalized.length() <= maxChars) {
            return normalized;
        }
        return normalized.substring(0, maxChars) + "...";
    }

    private HttpClient getHttpClient() {
        if (httpClient != null) {
            return httpClient;
        }
        synchronized (this) {
            if (httpClient == null) {
                int timeoutMillis = Math.max(embeddingProperties.getPython().getTimeoutMillis(), 1000);
                httpClient = HttpClient.newBuilder()
                        // Uvicorn/FastAPI expects plain HTTP/1.1; prevent h2c upgrade noise and missing-body edge cases.
                        .version(HttpClient.Version.HTTP_1_1)
                        .connectTimeout(Duration.ofMillis(timeoutMillis))
                        .build();
            }
            return httpClient;
        }
    }
}

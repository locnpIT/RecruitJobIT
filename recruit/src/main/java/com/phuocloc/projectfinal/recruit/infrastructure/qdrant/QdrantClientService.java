package com.phuocloc.projectfinal.recruit.infrastructure.qdrant;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * HTTP client tối giản để giao tiếp Qdrant qua REST API.
 * Service này không phụ thuộc SDK để giảm rủi ro version và dễ debug bằng raw request.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class QdrantClientService {

    private final QdrantProperties qdrantProperties;
    private final ObjectMapper objectMapper;

    private final Set<String> ensuredCollections = ConcurrentHashMap.newKeySet();
    private volatile HttpClient httpClient;

    public boolean isEnabled() {
        return qdrantProperties.isEnabled();
    }

    /**
     * Upsert một point vào collection.
     * Nếu collection chưa tồn tại sẽ tự tạo theo vector-size đã cấu hình.
     */
    public void upsertPoint(String collection, String pointId, List<Float> vector, Map<String, Object> payload) {
        if (!isEnabled()) {
            return;
        }
        ensureCollection(collection);
        Map<String, Object> body = Map.of(
                "points",
                List.of(
                        Map.of(
                                "id", pointId,
                                "vector", vector,
                                "payload", payload == null ? Map.of() : payload
                        )
                )
        );
        sendRequest("PUT", "/collections/" + encoded(collection) + "/points?wait=true", body, true);
    }

    /**
     * Xóa point khỏi collection theo point-id.
     * Dùng cho các bản ghi không còn active trong semantic search.
     */
    public void deletePoint(String collection, String pointId) {
        if (!isEnabled()) {
            return;
        }
        ensureCollection(collection);
        Map<String, Object> body = Map.of("points", List.of(pointId));
        sendRequest("POST", "/collections/" + encoded(collection) + "/points/delete?wait=true", body, true);
    }

    /**
     * Đảm bảo collection tồn tại trước khi upsert/delete.
     * Strategy:
     * 1) GET để kiểm tra.
     * 2) Nếu 404 thì tạo mới.
     * 3) Cache lại vào ensuredCollections để giảm số request lặp.
     */
    private void ensureCollection(String collection) {
        if (!isEnabled() || !StringUtils.hasText(collection) || ensuredCollections.contains(collection)) {
            return;
        }
        synchronized (ensuredCollections) {
            if (ensuredCollections.contains(collection)) {
                return;
            }

            HttpResponse<String> getResponse = sendRequest("GET", "/collections/" + encoded(collection), null, false);
            if (getResponse.statusCode() == HttpStatus.OK.value()) {
                ensuredCollections.add(collection);
                return;
            }

            if (getResponse.statusCode() != HttpStatus.NOT_FOUND.value()) {
                throw new IllegalStateException("Không kiểm tra được collection Qdrant " + collection
                        + " (status=" + getResponse.statusCode() + ")");
            }

            Map<String, Object> createBody = Map.of(
                    "vectors",
                    Map.of(
                            "size", qdrantProperties.getVectorSize(),
                            "distance", "Cosine"
                    )
            );
            HttpResponse<String> createResponse = sendRequest("PUT", "/collections/" + encoded(collection), createBody, false);
            if (createResponse.statusCode() < 200 || createResponse.statusCode() >= 300) {
                throw new IllegalStateException("Tạo collection Qdrant thất bại: " + collection
                        + " (status=" + createResponse.statusCode() + ", body=" + createResponse.body() + ")");
            }
            ensuredCollections.add(collection);
            log.info("Đã tạo collection Qdrant {}", collection);
        }
    }

    /**
     * Hàm gửi request chung cho mọi endpoint Qdrant.
     * Khi throwOnError = true, mọi status non-2xx sẽ ném exception để service nghiệp vụ xử lý.
     */
    private HttpResponse<String> sendRequest(String method, String path, Object body, boolean throwOnError) {
        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(normalizeBaseUrl(qdrantProperties.getUrl()) + path))
                    .timeout(Duration.ofMillis(Math.max(qdrantProperties.getTimeoutMillis(), 1000)))
                    .header("Content-Type", "application/json");

            if (StringUtils.hasText(qdrantProperties.getApiKey())) {
                builder.header("api-key", qdrantProperties.getApiKey().trim());
            }

            if (body == null) {
                builder.method(method, HttpRequest.BodyPublishers.noBody());
            } else {
                builder.method(method, HttpRequest.BodyPublishers.ofString(toJson(body)));
            }

            HttpResponse<String> response = getHttpClient().send(builder.build(), HttpResponse.BodyHandlers.ofString());
            if (throwOnError && (response.statusCode() < 200 || response.statusCode() >= 300)) {
                // Log body lỗi để debug nhanh payload hoặc config sai.
                throw new IllegalStateException("Qdrant request thất bại: "
                        + method + " " + path
                        + " (status=" + response.statusCode() + ", body=" + response.body() + ")");
            }
            return response;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Không gọi được Qdrant endpoint " + method + " " + path, ex);
        } catch (IOException ex) {
            throw new IllegalStateException("Không gọi được Qdrant endpoint " + method + " " + path, ex);
        }
    }

    /**
     * Lazy-init HttpClient để tái sử dụng connection và giảm overhead tạo client mới.
     */
    private HttpClient getHttpClient() {
        if (httpClient != null) {
            return httpClient;
        }
        synchronized (this) {
            if (httpClient == null) {
                httpClient = HttpClient.newBuilder()
                        .connectTimeout(Duration.ofMillis(Math.max(qdrantProperties.getTimeoutMillis(), 1000)))
                        .build();
            }
            return httpClient;
        }
    }

    /**
     * Chuẩn hóa base URL để tránh lỗi double-slash khi ghép path.
     */
    private String normalizeBaseUrl(String rawUrl) {
        if (!StringUtils.hasText(rawUrl)) {
            throw new IllegalStateException("app.qdrant.url chưa được cấu hình");
        }
        String normalized = rawUrl.trim();
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    /**
     * Encode collection-name/identifier an toàn khi đưa vào URL path.
     */
    private String encoded(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    /**
     * Serialize body gửi Qdrant qua cùng ObjectMapper của Spring để đồng nhất config JSON.
     */
    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Không serialize được request body gửi Qdrant", ex);
        }
    }
}

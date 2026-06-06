package com.phuocloc.projectfinal.recruit.infrastructure.qdrant;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
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
import java.util.ArrayList;
import java.util.Optional;
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
     * Search vector trong một collection và trả về payload để service nghiệp vụ map về entity.
     */
    public List<QdrantSearchResult> searchPoints(String collection, List<Float> vector, int limit) {
        return searchPoints(collection, vector, limit, Map.of());
    }

    /**
     * Search vector kèm filter payload dạng equals để giới hạn phạm vi semantic search.
     */
    public List<QdrantSearchResult> searchPoints(
            String collection,
            List<Float> vector,
            int limit,
            Map<String, Object> payloadEquals
    ) {
        if (!isEnabled()) {
            return List.of();
        }
        ensureCollection(collection);
        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("vector", vector);
        body.put("limit", Math.max(limit, 1));
        body.put("with_payload", true);
        body.put("with_vector", false);
        if (payloadEquals != null && !payloadEquals.isEmpty()) {
            body.put("filter", buildPayloadEqualsFilter(payloadEquals));
        }
        HttpResponse<String> response = sendRequest(
                "POST",
                "/collections/" + encoded(collection) + "/points/search",
                body,
                true
        );
        return parseSearchResults(response.body());
    }

    /**
     * Search vector trong collection, lọc theo danh sách giá trị của một payload field.
     * Dùng cho luồng rank ứng viên đã nộp đơn: filter hoSoUngVienId IN [...] thay vì dùng collection riêng.
     */
    public List<QdrantSearchResult> searchPointsByPayloadIds(
            String collection,
            List<Float> vector,
            int limit,
            String payloadKey,
            List<Integer> ids
    ) {
        if (!isEnabled() || ids == null || ids.isEmpty()) {
            return List.of();
        }
        ensureCollection(collection);
        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("vector", vector);
        body.put("limit", Math.max(limit, 1));
        body.put("with_payload", true);
        body.put("with_vector", false);
        body.put("filter", Map.of("must", List.of(
                Map.of("key", payloadKey, "match", Map.of("any", ids))
        )));
        HttpResponse<String> response = sendRequest(
                "POST",
                "/collections/" + encoded(collection) + "/points/search",
                body,
                true
        );
        return parseSearchResults(response.body());
    }

    private Map<String, Object> buildPayloadEqualsFilter(Map<String, Object> payloadEquals) {
        List<Map<String, Object>> must = payloadEquals.entrySet().stream()
                .filter(entry -> StringUtils.hasText(entry.getKey()) && entry.getValue() != null)
                .map(entry -> Map.of(
                        "key", entry.getKey(),
                        "match", Map.of("value", entry.getValue())
                ))
                .toList();
        return Map.of("must", must);
    }

    /**
     * Lấy lại vector của một point đã upsert trong Qdrant.
     * Dùng cho lazy cache: lần đầu tạo embedding, các lần sau lấy vector từ collection thay vì gọi model lại.
     */
    public Optional<List<Float>> getPointVector(String collection, String pointId) {
        if (!isEnabled() || !StringUtils.hasText(pointId)) {
            return Optional.empty();
        }
        ensureCollection(collection);
        Map<String, Object> body = Map.of(
                "ids", List.of(pointId),
                "with_payload", false,
                "with_vector", true
        );
        HttpResponse<String> response = sendRequest(
                "POST",
                "/collections/" + encoded(collection) + "/points",
                body,
                true
        );
        return parsePointVector(response.body());
    }

    /**
     * Lấy payload của một point để kiểm tra metadata index mà không cần tải vector.
     */
    public Optional<Map<String, Object>> getPointPayload(String collection, String pointId) {
        if (!isEnabled() || !StringUtils.hasText(pointId)) {
            return Optional.empty();
        }
        ensureCollection(collection);
        Map<String, Object> body = Map.of(
                "ids", List.of(pointId),
                "with_payload", true,
                "with_vector", false
        );
        HttpResponse<String> response = sendRequest(
                "POST",
                "/collections/" + encoded(collection) + "/points",
                body,
                true
        );
        return parsePointPayload(response.body());
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

    private List<QdrantSearchResult> parseSearchResults(String body) {
        try {
            JsonNode resultNode = objectMapper.readTree(body).path("result");
            if (!resultNode.isArray()) {
                return List.of();
            }
            List<QdrantSearchResult> results = new ArrayList<>(resultNode.size());
            for (JsonNode item : resultNode) {
                Map<String, Object> payload = objectMapper.convertValue(
                        item.path("payload"),
                        new TypeReference<Map<String, Object>>() {}
                );
                results.add(new QdrantSearchResult(
                        item.path("id").asText(),
                        item.path("score").asDouble(),
                        payload == null ? Map.of() : payload
                ));
            }
            return results;
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Không parse được response search từ Qdrant", ex);
        }
    }

    private Optional<List<Float>> parsePointVector(String body) {
        try {
            JsonNode resultNode = objectMapper.readTree(body).path("result");
            if (!resultNode.isArray() || resultNode.isEmpty()) {
                return Optional.empty();
            }
            JsonNode vectorNode = resultNode.get(0).path("vector");
            if (!vectorNode.isArray()) {
                return Optional.empty();
            }
            List<Float> vector = new ArrayList<>(vectorNode.size());
            for (JsonNode item : vectorNode) {
                vector.add((float) item.asDouble());
            }
            return vector.isEmpty() ? Optional.empty() : Optional.of(vector);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Không parse được vector point từ Qdrant", ex);
        }
    }

    private Optional<Map<String, Object>> parsePointPayload(String body) {
        try {
            JsonNode resultNode = objectMapper.readTree(body).path("result");
            if (!resultNode.isArray() || resultNode.isEmpty()) {
                return Optional.empty();
            }
            Map<String, Object> payload = objectMapper.convertValue(
                    resultNode.get(0).path("payload"),
                    new TypeReference<Map<String, Object>>() {}
            );
            return payload == null || payload.isEmpty() ? Optional.empty() : Optional.of(payload);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Không parse được payload point từ Qdrant", ex);
        }
    }
}

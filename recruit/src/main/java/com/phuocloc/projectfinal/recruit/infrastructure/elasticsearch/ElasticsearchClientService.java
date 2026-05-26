package com.phuocloc.projectfinal.recruit.infrastructure.elasticsearch;

import com.fasterxml.jackson.core.JsonProcessingException;
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
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * HTTP client tối giản cho Elasticsearch.
 *
 * <p>Dùng raw REST API thay vì SDK để hạn chế ràng buộc version và dễ debug request/response.</p>
 */
@Service
@RequiredArgsConstructor
public class ElasticsearchClientService {

    private final ElasticsearchProperties elasticsearchProperties;
    private final ObjectMapper objectMapper;

    private final Set<String> ensuredIndices = ConcurrentHashMap.newKeySet();
    private volatile HttpClient httpClient;

    public boolean isEnabled() {
        return elasticsearchProperties.isEnabled();
    }

    /**
     * Lấy thông tin cơ bản của Elasticsearch cluster để phục vụ health check vận hành.
     */
    public ElasticsearchClusterInfo getClusterInfo() {
        if (!isEnabled()) {
            return ElasticsearchClusterInfo.builder()
                    .clusterName(null)
                    .nodeName(null)
                    .version(null)
                    .build();
        }
        HttpResponse<String> response = sendRequest("GET", "/", null, true);
        try {
            JsonNode root = objectMapper.readTree(response.body());
            return ElasticsearchClusterInfo.builder()
                    .clusterName(root.path("cluster_name").asText(null))
                    .nodeName(root.path("name").asText(null))
                    .version(root.path("version").path("number").asText(null))
                    .build();
        } catch (IOException ex) {
            throw new IllegalStateException("Không parse được response Elasticsearch health", ex);
        }
    }

    /**
     * Upsert document vào index theo document-id cố định.
     */
    public void upsertDocument(String index, String documentId, Map<String, Object> document) {
        if (!isEnabled()) {
            return;
        }
        ensureIndex(index);
        sendRequest(
                "PUT",
                "/" + encoded(index) + "/_doc/" + encoded(documentId),
                document == null ? Map.of() : document,
                true
        );
    }

    /**
     * Xóa document khỏi index.
     */
    public void deleteDocument(String index, String documentId) {
        if (!isEnabled()) {
            return;
        }
        ensureIndex(index);
        HttpResponse<String> response = sendRequest(
                "DELETE",
                "/" + encoded(index) + "/_doc/" + encoded(documentId),
                null,
                false
        );
        if (response.statusCode() == HttpStatus.NOT_FOUND.value()) {
            return;
        }
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("Xóa document Elasticsearch thất bại: status=" + response.statusCode());
        }
    }

    /**
     * Chạy search DSL và parse về danh sách document-id + total.
     */
    public ElasticsearchSearchResult searchDocuments(String index, Map<String, Object> query) {
        if (!isEnabled()) {
            return ElasticsearchSearchResult.builder().documentIds(List.of()).total(0L).build();
        }
        ensureIndex(index);
        HttpResponse<String> response = sendRequest(
                "POST",
                "/" + encoded(index) + "/_search",
                query == null ? Map.of() : query,
                true
        );
        return parseSearchResult(response.body());
    }

    /**
     * Tạo index với mapping chuẩn của public-job search nếu chưa tồn tại.
     */
    private void ensureIndex(String index) {
        if (!isEnabled() || !StringUtils.hasText(index) || ensuredIndices.contains(index)) {
            return;
        }
        synchronized (ensuredIndices) {
            if (ensuredIndices.contains(index)) {
                return;
            }

            HttpResponse<String> getResponse = sendRequest("GET", "/" + encoded(index), null, false);
            if (getResponse.statusCode() == HttpStatus.OK.value()) {
                ensuredIndices.add(index);
                return;
            }

            if (getResponse.statusCode() != HttpStatus.NOT_FOUND.value()) {
                throw new IllegalStateException("Không kiểm tra được index Elasticsearch " + index
                        + " (status=" + getResponse.statusCode() + ")");
            }

            HttpResponse<String> createResponse = sendRequest("PUT", "/" + encoded(index), createIndexBody(), false);
            if (createResponse.statusCode() < 200 || createResponse.statusCode() >= 300) {
                throw new IllegalStateException("Tạo index Elasticsearch thất bại " + index
                        + " (status=" + createResponse.statusCode() + ", body=" + createResponse.body() + ")");
            }
            ensuredIndices.add(index);
        }
    }

    private Map<String, Object> createIndexBody() {
        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("jobId", Map.of("type", "keyword"));
        properties.put("tieuDe", Map.of("type", "text"));
        properties.put("moTa", Map.of("type", "text"));
        properties.put("yeuCau", Map.of("type", "text"));
        properties.put("phucLoi", Map.of("type", "text"));
        properties.put("congTyTen", Map.of("type", "text"));
        properties.put("nganhNgheTen", Map.of("type", "text"));
        properties.put("kyNangs", Map.of("type", "text"));
        properties.put("diaDiem", Map.of("type", "text"));
        properties.put("tinhThanhTen", Map.of("type", "text"));
        properties.put("xaPhuongTen", Map.of("type", "text"));
        properties.put("trangThai", Map.of("type", "keyword"));
        properties.put("congTyTrangThai", Map.of("type", "keyword"));
        properties.put("nganhNgheId", Map.of("type", "integer"));
        properties.put("loaiHinhLamViecId", Map.of("type", "integer"));
        properties.put("capDoKinhNghiemId", Map.of("type", "integer"));
        properties.put("luongToiThieu", Map.of("type", "integer"));
        properties.put("luongToiDa", Map.of("type", "integer"));
        properties.put("denHanLucEpoch", Map.of("type", "long"));
        properties.put("ngayTaoEpoch", Map.of("type", "long"));
        properties.put("ngayCapNhatEpoch", Map.of("type", "long"));

        return Map.of(
                "settings", Map.of(
                        "number_of_shards", 1,
                        "number_of_replicas", 0
                ),
                "mappings", Map.of(
                        "dynamic", false,
                        "properties", properties
                )
        );
    }

    private ElasticsearchSearchResult parseSearchResult(String rawBody) {
        try {
            JsonNode root = objectMapper.readTree(rawBody);
            JsonNode hitsNode = root.path("hits");
            JsonNode totalNode = hitsNode.path("total");
            long total = totalNode.path("value").asLong(0L);

            List<String> ids = new ArrayList<>();
            for (JsonNode hit : hitsNode.path("hits")) {
                String id = hit.path("_id").asText(null);
                if (StringUtils.hasText(id)) {
                    ids.add(id);
                }
            }
            return ElasticsearchSearchResult.builder()
                    .documentIds(ids)
                    .total(total)
                    .build();
        } catch (IOException ex) {
            throw new IllegalStateException("Không parse được response Elasticsearch _search", ex);
        }
    }

    private HttpResponse<String> sendRequest(String method, String path, Object body, boolean throwOnError) {
        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(normalizeBaseUrl(elasticsearchProperties.getUrl()) + path))
                    .timeout(Duration.ofMillis(Math.max(elasticsearchProperties.getTimeoutMillis(), 1000)))
                    .header("Content-Type", "application/json");

            attachAuthHeaders(builder);

            if (body == null) {
                builder.method(method, HttpRequest.BodyPublishers.noBody());
            } else {
                builder.method(method, HttpRequest.BodyPublishers.ofString(toJson(body)));
            }

            HttpResponse<String> response = getHttpClient().send(builder.build(), HttpResponse.BodyHandlers.ofString());
            if (throwOnError && (response.statusCode() < 200 || response.statusCode() >= 300)) {
                throw new IllegalStateException("Elasticsearch request thất bại: "
                        + method + " " + path
                        + " (status=" + response.statusCode() + ", body=" + response.body() + ")");
            }
            return response;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Không gọi được Elasticsearch endpoint " + method + " " + path, ex);
        } catch (IOException ex) {
            throw new IllegalStateException("Không gọi được Elasticsearch endpoint " + method + " " + path, ex);
        }
    }

    private void attachAuthHeaders(HttpRequest.Builder builder) {
        if (StringUtils.hasText(elasticsearchProperties.getApiKey())) {
            builder.header("Authorization", "ApiKey " + elasticsearchProperties.getApiKey().trim());
            return;
        }
        if (StringUtils.hasText(elasticsearchProperties.getUsername()) && StringUtils.hasText(elasticsearchProperties.getPassword())) {
            String raw = elasticsearchProperties.getUsername().trim() + ":" + elasticsearchProperties.getPassword();
            String encoded = Base64.getEncoder().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
            builder.header("Authorization", "Basic " + encoded);
        }
    }

    private HttpClient getHttpClient() {
        if (httpClient != null) {
            return httpClient;
        }
        synchronized (this) {
            if (httpClient == null) {
                httpClient = HttpClient.newBuilder()
                        .connectTimeout(Duration.ofMillis(Math.max(elasticsearchProperties.getTimeoutMillis(), 1000)))
                        .build();
            }
            return httpClient;
        }
    }

    private String normalizeBaseUrl(String rawUrl) {
        if (!StringUtils.hasText(rawUrl)) {
            throw new IllegalStateException("app.elasticsearch.url chưa được cấu hình");
        }
        String normalized = rawUrl.trim();
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private String encoded(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Không serialize được Elasticsearch request body", ex);
        }
    }

    @Getter
    @Builder
    public static class ElasticsearchClusterInfo {
        private String clusterName;
        private String nodeName;
        private String version;
    }
}

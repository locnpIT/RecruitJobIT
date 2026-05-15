package com.phuocloc.projectfinal.recruit.notification.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Builder;
import lombok.Getter;
import org.springframework.util.StringUtils;

/**
 * Encode/decode payload thông báo dưới dạng JSON string lưu trong cột noiDung.
 *
 * <p>Schema hiện tại không có cột deepLink riêng, nên dữ liệu được nhúng theo format:
 * {"text":"...","link":"/some-path"}.</p>
 */
public final class NotificationPayloadCodec {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private NotificationPayloadCodec() {
    }

    public static String encode(String text, String link) {
        try {
            JsonNode node = OBJECT_MAPPER.createObjectNode()
                    .put("text", trimToEmpty(text))
                    .put("link", trimToEmpty(link));
            return OBJECT_MAPPER.writeValueAsString(node);
        } catch (Exception ex) {
            // Fallback an toàn để không làm fail flow nghiệp vụ chính.
            return trimToEmpty(text);
        }
    }

    public static DecodedPayload decode(String rawContent) {
        if (!StringUtils.hasText(rawContent)) {
            return DecodedPayload.builder().text("").link(null).build();
        }

        String normalized = rawContent.trim();
        if (normalized.startsWith("{") && normalized.endsWith("}")) {
            try {
                JsonNode node = OBJECT_MAPPER.readTree(normalized);
                String text = node.path("text").asText("");
                String link = trimToNull(node.path("link").asText(null));
                return DecodedPayload.builder().text(text).link(link).build();
            } catch (Exception ignored) {
                // Nếu parse lỗi thì coi như plain text để giữ backward compatibility.
            }
        }

        return DecodedPayload.builder().text(normalized).link(null).build();
    }

    private static String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    @Getter
    @Builder
    public static class DecodedPayload {
        private String text;
        private String link;
    }
}

package com.phuocloc.projectfinal.recruit.infrastructure.gemini;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Cấu hình Gemini cho các luồng AI dùng LangChain4j.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.gemini")
public class GeminiProperties {

    // Bật/tắt luồng gọi Gemini mà không cần thay code khi chạy local.
    private boolean enabled = false;
    // API key lấy từ Google AI Studio.
    private String apiKey;
    // Model mặc định ưu tiên nhanh/tiết kiệm cho search ngắn.
    private String modelName = "gemini-2.5-flash";
    // Timeout gọi model để tránh request public bị treo quá lâu.
    private int timeoutMillis = 20000;
}

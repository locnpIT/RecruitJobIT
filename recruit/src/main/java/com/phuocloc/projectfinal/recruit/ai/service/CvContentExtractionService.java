package com.phuocloc.projectfinal.recruit.ai.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Locale;
import java.util.Objects;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Trích xuất text từ CV URL để làm đầu vào embedding cho DonUngTuyen.
 *
 * <p>Schema hiện tại chỉ có cột {@code cvUrl}, nên backend cần tải file từ URL và parse nội dung
 * ngay trong runtime indexing, không thêm cột DB mới.</p>
 */
@Service
@Slf4j
public class CvContentExtractionService {

    private static final int MAX_TEXT_LENGTH = 20_000;
    private static final int HTTP_TIMEOUT_SECONDS = 8;
    private static final String PDF_EXTENSION = ".pdf";

    private volatile HttpClient httpClient;

    /**
     * Trả về nội dung text đã chuẩn hóa từ CV URL.
     *
     * <p>Ưu tiên parse PDF; nếu không phải PDF thì thử đọc như plain-text UTF-8.
     * Nếu có lỗi mạng/format, trả về {@code null} để caller fallback sang dữ liệu profile khác.</p>
     */
    public String extract(String cvUrl) {
        if (!StringUtils.hasText(cvUrl)) {
            return null;
        }
        String normalizedUrl = cvUrl.trim();
        try {
            byte[] fileBytes = downloadFile(normalizedUrl);
            if (fileBytes.length == 0) {
                return null;
            }

            if (isPdf(normalizedUrl, fileBytes)) {
                return truncate(normalizeText(extractFromPdf(fileBytes)));
            }
            return truncate(normalizeText(new String(fileBytes, StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            log.warn("Không trích xuất được nội dung CV từ URL {}", normalizedUrl, ex);
            return null;
        }
    }

    private byte[] downloadFile(String cvUrl) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(cvUrl))
                .timeout(Duration.ofSeconds(HTTP_TIMEOUT_SECONDS))
                .GET()
                .build();
        HttpResponse<byte[]> response = getHttpClient().send(request, HttpResponse.BodyHandlers.ofByteArray());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("Tải CV thất bại với status " + response.statusCode());
        }
        return Objects.requireNonNullElse(response.body(), new byte[0]);
    }

    private boolean isPdf(String cvUrl, byte[] fileBytes) {
        String lowerUrl = cvUrl.toLowerCase(Locale.ROOT);
        if (lowerUrl.contains(PDF_EXTENSION)) {
            return true;
        }
        // Signature cơ bản của PDF file: "%PDF"
        return fileBytes.length >= 4
                && fileBytes[0] == 0x25
                && fileBytes[1] == 0x50
                && fileBytes[2] == 0x44
                && fileBytes[3] == 0x46;
    }

    private String extractFromPdf(byte[] fileBytes) throws IOException {
        try (PDDocument document = Loader.loadPDF(fileBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private String normalizeText(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        // Chuẩn hóa whitespace để vector ổn định hơn giữa các lần sync.
        return raw
                .replace('\r', '\n')
                .replaceAll("[\\t\\x0B\\f]+", " ")
                .replaceAll("\\n{3,}", "\n\n")
                .trim();
    }

    private String truncate(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        if (value.length() <= MAX_TEXT_LENGTH) {
            return value;
        }
        return value.substring(0, MAX_TEXT_LENGTH);
    }

    private HttpClient getHttpClient() {
        if (httpClient != null) {
            return httpClient;
        }
        synchronized (this) {
            if (httpClient == null) {
                httpClient = HttpClient.newBuilder()
                        .connectTimeout(Duration.ofSeconds(HTTP_TIMEOUT_SECONDS))
                        .build();
            }
            return httpClient;
        }
    }
}

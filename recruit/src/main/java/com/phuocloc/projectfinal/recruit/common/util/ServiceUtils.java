package com.phuocloc.projectfinal.recruit.common.util;

import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

/**
 * Utility methods dùng chung cho các service layer.
 * Tránh định nghĩa lại cùng một logic normalizeEmail/trimToNull/toIntId
 * ở nhiều service khác nhau.
 */
public final class ServiceUtils {

    private ServiceUtils() {
    }

    /**
     * Trim và lowercase email. Ném BAD_REQUEST nếu rỗng.
     */
    public static String normalizeEmail(String email) {
        if (!StringUtils.hasText(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email không được để trống");
        }
        return email.trim().toLowerCase(java.util.Locale.ROOT);
    }

    /**
     * Trả về null nếu blank, ngược lại trim.
     */
    public static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    /**
     * Chuyển Long → Integer an toàn. Ném BAD_REQUEST nếu null hoặc vượt phạm vi.
     */
    public static Integer toIntId(Long id, String fieldName) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " không được để trống");
        }
        if (id > Integer.MAX_VALUE || id < Integer.MIN_VALUE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " vượt phạm vi Integer");
        }
        return id.intValue();
    }

    /**
     * Chuyển Integer → Long null-safe. Dùng thay cho boilerplate
     * {@code id == null ? null : id.longValue()} ở khắp nơi.
     */
    public static Long toLong(Integer id) {
        return id == null ? null : id.longValue();
    }

    /**
     * Trim + lowercase, trả về chuỗi rỗng nếu null. Dùng cho filter/search in-memory.
     */
    public static String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    /**
     * Ghép họ + tên, trim kết quả. Trả về chuỗi rỗng nếu cả hai đều blank.
     */
    public static String buildFullName(String ho, String ten) {
        return ((StringUtils.hasText(ho) ? ho.trim() : "") + " " + (StringUtils.hasText(ten) ? ten.trim() : "")).trim();
    }

    /**
     * Kiểm tra source có chứa keyword không (case-sensitive, null-safe).
     */
    public static boolean contains(String source, String keyword) {
        return StringUtils.hasText(source) && source.contains(keyword);
    }
}

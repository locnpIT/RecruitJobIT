package com.phuocloc.projectfinal.recruit.chat.websocket;

import com.phuocloc.projectfinal.recruit.auth.service.JwtService;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

@Component
@RequiredArgsConstructor
/**
 * Xác thực websocket handshake bằng JWT token trên query string.
 *
 * <p>Browser WebSocket API không hỗ trợ custom Authorization header ổn định trong mọi flow,
 * nên server đọc token từ `?token=` và lưu userId vào session attributes.</p>
 */
public class ChatWebSocketHandshakeInterceptor implements HandshakeInterceptor {

    public static final String WS_USER_ID_ATTRIBUTE = "wsUserId";

    private final JwtService jwtService;

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes
    ) {
        // Parse token trực tiếp từ URL handshake.
        String token = extractToken(request.getURI());
        if (token == null || token.isBlank() || !jwtService.istokenValid(token)) {
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }

        // userId sẽ được ChatWebSocketHandler dùng để register session đúng owner.
        attributes.put(WS_USER_ID_ATTRIBUTE, jwtService.extractUserIdFromToken(token));
        return true;
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception
    ) {
        // No-op.
    }

    private String extractToken(URI uri) {
        if (uri == null || uri.getRawQuery() == null) {
            return null;
        }

        String[] pairs = uri.getRawQuery().split("&");
        for (String pair : pairs) {
            int idx = pair.indexOf('=');
            if (idx <= 0) {
                continue;
            }
            String key = pair.substring(0, idx);
            if (!"token".equals(key)) {
                continue;
            }
            // Decode để hỗ trợ token chứa ký tự URL-escaped.
            return java.net.URLDecoder.decode(pair.substring(idx + 1), StandardCharsets.UTF_8);
        }
        return null;
    }
}

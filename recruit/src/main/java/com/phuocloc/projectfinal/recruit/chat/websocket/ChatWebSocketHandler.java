package com.phuocloc.projectfinal.recruit.chat.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Slf4j
@Component
@RequiredArgsConstructor
/**
 * WebSocket handler cho kênh chat realtime.
 *
 * <p>MVP dùng mô hình "REST để gửi, WS để nhận".
 * Do đó handler này chủ yếu quản lý lifecycle kết nối (connect/disconnect).</p>
 */
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ChatWebSocketSessionRegistry sessionRegistry;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Long userId = resolveUserId(session);
        if (userId == null) {
            // Session không có userId nghĩa là handshake chưa pass đúng token.
            closeSilently(session);
            return;
        }
        sessionRegistry.register(userId, session);
    }

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) {
        // MVP giữ channel một chiều từ server -> client.
        // Việc gửi tin nhắn đi qua REST API để tái sử dụng đầy đủ validation và authorization.
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Long userId = resolveUserId(session);
        if (userId != null) {
            sessionRegistry.unregister(userId, session);
        }
    }

    private Long resolveUserId(WebSocketSession session) {
        // Giá trị được inject từ ChatWebSocketHandshakeInterceptor.
        Object value = session.getAttributes().get(ChatWebSocketHandshakeInterceptor.WS_USER_ID_ATTRIBUTE);
        if (value instanceof Long userId) {
            return userId;
        }
        if (value instanceof Integer userId) {
            return userId.longValue();
        }
        return null;
    }

    private void closeSilently(WebSocketSession session) {
        try {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("Unauthorized websocket session"));
        } catch (Exception ex) {
            log.debug("Cannot close websocket session safely", ex);
        }
    }
}

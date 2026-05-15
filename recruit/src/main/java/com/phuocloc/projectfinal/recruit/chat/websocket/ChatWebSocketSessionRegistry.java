package com.phuocloc.projectfinal.recruit.chat.websocket;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.ConcurrentWebSocketSessionDecorator;

@Component
/**
 * Registry lưu các websocket session theo user.
 *
 * <p>Một user có thể mở nhiều tab/device nên map value là Set session.
 * Registry này giúp publisher biết cần đẩy event realtime tới những connection nào.</p>
 */
public class ChatWebSocketSessionRegistry {

    private static final int SEND_TIME_LIMIT_MS = 10_000;
    private static final int BUFFER_SIZE_LIMIT_BYTES = 512 * 1024;

    // Key: userId, Value: danh sách websocket đang mở của user đó.
    private final Map<Long, Set<WebSocketSession>> sessionsByUser = new ConcurrentHashMap<>();

    public void register(Long userId, WebSocketSession session) {
        if (userId == null || session == null) {
            return;
        }
        // Decorator để tránh kẹt thread khi client nhận chậm hoặc payload dồn nhiều.
        WebSocketSession safeSession = new ConcurrentWebSocketSessionDecorator(
                session,
                SEND_TIME_LIMIT_MS,
                BUFFER_SIZE_LIMIT_BYTES
        );
        sessionsByUser.computeIfAbsent(userId, key -> ConcurrentHashMap.newKeySet()).add(safeSession);
    }

    public void unregister(Long userId, WebSocketSession session) {
        if (userId == null || session == null) {
            return;
        }
        Set<WebSocketSession> sessions = sessionsByUser.get(userId);
        if (sessions == null) {
            return;
        }
        sessions.remove(session);
        // Dọn key rỗng để giảm memory footprint khi user disconnect toàn bộ.
        if (sessions.isEmpty()) {
            sessionsByUser.remove(userId);
        }
    }

    public Set<WebSocketSession> getSessions(Long userId) {
        return sessionsByUser.getOrDefault(userId, Set.of());
    }
}

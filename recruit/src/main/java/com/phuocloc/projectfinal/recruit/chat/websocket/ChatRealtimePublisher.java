package com.phuocloc.projectfinal.recruit.chat.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.phuocloc.projectfinal.recruit.chat.dto.response.ChatRealtimeEventResponse;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

@Slf4j
@Component
@RequiredArgsConstructor
/**
 * Publisher phát event chat realtime tới các websocket session của participant.
 */
public class ChatRealtimePublisher {

    private final ObjectMapper objectMapper;
    private final ChatWebSocketSessionRegistry sessionRegistry;

    public void publishToUsers(Set<Long> userIds, ChatRealtimeEventResponse event) {
        if (userIds == null || userIds.isEmpty() || event == null) {
            return;
        }
        String payload = serialize(event);
        if (payload == null) {
            return;
        }

        for (Long userId : userIds) {
            // Một user có thể mở nhiều tab -> broadcast tới toàn bộ session đang online.
            for (WebSocketSession session : sessionRegistry.getSessions(userId)) {
                sendSafely(session, payload);
            }
        }
    }

    private String serialize(ChatRealtimeEventResponse event) {
        try {
            return objectMapper.writeValueAsString(event);
        } catch (Exception ex) {
            log.warn("Cannot serialize websocket chat event", ex);
            return null;
        }
    }

    private void sendSafely(WebSocketSession session, String payload) {
        if (session == null || !session.isOpen()) {
            return;
        }
        try {
            session.sendMessage(new TextMessage(payload));
        } catch (Exception ex) {
            // Không throw để tránh làm hỏng luồng gửi cho các session/user khác.
            log.debug("Cannot send websocket message to session {}", session.getId(), ex);
        }
    }
}

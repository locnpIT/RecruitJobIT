package com.phuocloc.projectfinal.recruit.chat.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ChatRealtimeEventResponse {

    private String type;
    private Long conversationId;
    private ChatMessageResponse message;
    private Long readerId;
}

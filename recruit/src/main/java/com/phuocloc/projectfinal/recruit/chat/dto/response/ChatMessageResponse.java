package com.phuocloc.projectfinal.recruit.chat.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ChatMessageResponse {

    private Long id;
    private Long conversationId;
    private Long senderId;
    private String senderDisplayName;
    private String noiDung;
    private Boolean daDoc;
    private Boolean mine;
    private LocalDateTime ngayTao;
}

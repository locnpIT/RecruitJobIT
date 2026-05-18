package com.phuocloc.projectfinal.recruit.chat.dto.response;

import lombok.Builder;
import lombok.Getter;

/**
 * DTO trả dữ liệu từ server cho API ChatRealtimeEventResponse.
 * Giữ response rõ ràng để frontend dễ hiển thị và bảo trì.
 */
@Getter
@Builder
public class ChatRealtimeEventResponse {

    private String loai;
    private Long cuocTroChuyenId;
    private ChatMessageResponse tinNhan;
    private Long nguoiDocId;
}

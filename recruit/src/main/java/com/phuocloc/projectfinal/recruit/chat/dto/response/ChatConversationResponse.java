package com.phuocloc.projectfinal.recruit.chat.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ChatConversationResponse {

    private Long id;
    private Long ungVienId;
    private String ungVienDisplayName;
    private String ungVienAvatarUrl;
    private Long nhaTuyenDungId;
    private String nhaTuyenDungDisplayName;
    private String nhaTuyenDungAvatarUrl;
    private String tinNhanGanNhat;
    private LocalDateTime tinNhanGanNhatLuc;
    private Long soTinChuaDoc;
    private LocalDateTime ngayTao;
}

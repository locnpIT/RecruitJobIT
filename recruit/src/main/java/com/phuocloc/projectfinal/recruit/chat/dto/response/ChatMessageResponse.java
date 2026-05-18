package com.phuocloc.projectfinal.recruit.chat.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

/**
 * DTO trả dữ liệu từ server cho API ChatMessageResponse.
 * Giữ response rõ ràng để frontend dễ hiển thị và bảo trì.
 */
@Getter
@Builder
public class ChatMessageResponse {

    private Long id;
    private Long cuocTroChuyenId;
    private Long nguoiGuiId;
    private String nguoiGuiHienThiTen;
    private String noiDung;
    private Boolean daDoc;
    private Boolean cuaToi;
    private LocalDateTime ngayTao;
}

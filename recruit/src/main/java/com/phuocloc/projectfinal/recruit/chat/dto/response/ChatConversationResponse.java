package com.phuocloc.projectfinal.recruit.chat.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

/**
 * DTO trả dữ liệu từ server cho API ChatConversationResponse.
 * Giữ response rõ ràng để frontend dễ hiển thị và bảo trì.
 */
@Getter
@Builder
public class ChatConversationResponse {

    private Long id;
    private Long ungVienId;
    private String ungVienHienThiTen;
    private String ungVienAnhDaiDienUrl;
    private Long nhaTuyenDungId;
    private String nhaTuyenDungHienThiTen;
    private String nhaTuyenDungAnhDaiDienUrl;
    private String tinNhanGanNhat;
    private LocalDateTime tinNhanGanNhatLuc;
    private Long soTinChuaDoc;
    private LocalDateTime ngayTao;
}

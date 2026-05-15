package com.phuocloc.projectfinal.recruit.chat.controller;

import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.chat.dto.request.CreateChatMessageRequest;
import com.phuocloc.projectfinal.recruit.chat.dto.response.ChatConversationResponse;
import com.phuocloc.projectfinal.recruit.chat.dto.response.ChatMessageResponse;
import com.phuocloc.projectfinal.recruit.chat.service.ChatService;
import com.phuocloc.projectfinal.recruit.common.response.SuccessResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/chats")
@RequiredArgsConstructor
/**
 * API chat realtime giữa ứng viên và nhà tuyển dụng.
 *
 * <p>Controller chỉ giữ trách nhiệm điều phối I/O; toàn bộ rule participant và validation nằm ở service.</p>
 */
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/jobs/{jobId}/open")
    // Mở room từ ngữ cảnh job detail: tạo mới nếu chưa tồn tại, hoặc trả room cũ nếu đã có.
    public ResponseEntity<SuccessResponse<ChatConversationResponse>> openByJob(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long jobId
    ) {
        requireAuthenticated(principal);
        return ResponseEntity.ok(new SuccessResponse<>(
                "Mở cuộc trò chuyện thành công",
                chatService.openConversationByPublicJob(principal.getUserId(), jobId)
        ));
    }

    @GetMapping("/conversations")
    // Lấy inbox hiện tại của user đăng nhập.
    public ResponseEntity<SuccessResponse<List<ChatConversationResponse>>> listConversations(
            @AuthenticationPrincipal AppUserPrinciple principal
    ) {
        requireAuthenticated(principal);
        return ResponseEntity.ok(new SuccessResponse<>(
                "Lấy danh sách cuộc trò chuyện thành công",
                chatService.listMyConversations(principal.getUserId())
        ));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    // Lấy lịch sử tin nhắn của một room (đồng thời đánh dấu đã đọc phía đối phương).
    public ResponseEntity<SuccessResponse<List<ChatMessageResponse>>> listMessages(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long conversationId
    ) {
        requireAuthenticated(principal);
        return ResponseEntity.ok(new SuccessResponse<>(
                "Lấy danh sách tin nhắn thành công",
                chatService.listMessages(principal.getUserId(), conversationId)
        ));
    }

    @PostMapping("/conversations/{conversationId}/messages")
    // Gửi một message mới vào room.
    public ResponseEntity<SuccessResponse<ChatMessageResponse>> sendMessage(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long conversationId,
            @RequestBody CreateChatMessageRequest request
    ) {
        requireAuthenticated(principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(new SuccessResponse<>(
                HttpStatus.CREATED,
                "Gửi tin nhắn thành công",
                chatService.sendMessage(principal.getUserId(), conversationId, request)
        ));
    }

    private void requireAuthenticated(AppUserPrinciple principal) {
        if (principal == null || principal.getUserId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bạn cần đăng nhập");
        }
    }
}

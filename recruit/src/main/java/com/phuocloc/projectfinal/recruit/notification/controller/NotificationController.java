package com.phuocloc.projectfinal.recruit.notification.controller;

import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.common.response.SuccessResponse;
import com.phuocloc.projectfinal.recruit.notification.dto.response.NotificationItemResponse;
import com.phuocloc.projectfinal.recruit.notification.dto.response.NotificationListResponse;
import com.phuocloc.projectfinal.recruit.notification.dto.response.NotificationMarkAllReadResponse;
import com.phuocloc.projectfinal.recruit.notification.dto.response.NotificationUnreadCountResponse;
import com.phuocloc.projectfinal.recruit.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
/**
 * API thông báo in-app cho user đã đăng nhập.
 */
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<SuccessResponse<NotificationListResponse>> list(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        requireAuthenticated(principal);
        var data = notificationService.listMyNotifications(principal.getUserId(), page, size);
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách thông báo thành công", data));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<SuccessResponse<NotificationUnreadCountResponse>> unreadCount(
            @AuthenticationPrincipal AppUserPrinciple principal
    ) {
        requireAuthenticated(principal);
        var data = notificationService.getUnreadCount(principal.getUserId());
        return ResponseEntity.ok(new SuccessResponse<>("Lấy số lượng thông báo chưa đọc thành công", data));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<SuccessResponse<NotificationItemResponse>> markRead(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long notificationId
    ) {
        requireAuthenticated(principal);
        var data = notificationService.markRead(principal.getUserId(), notificationId);
        return ResponseEntity.ok(new SuccessResponse<>("Đánh dấu đã đọc thành công", data));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<SuccessResponse<NotificationMarkAllReadResponse>> markAllRead(
            @AuthenticationPrincipal AppUserPrinciple principal
    ) {
        requireAuthenticated(principal);
        long updated = notificationService.markAllRead(principal.getUserId());
        var data = new NotificationMarkAllReadResponse(updated);
        return ResponseEntity.ok(new SuccessResponse<>("Đánh dấu tất cả thông báo đã đọc thành công", data));
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<SuccessResponse<Void>> delete(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long notificationId
    ) {
        requireAuthenticated(principal);
        notificationService.deleteNotification(principal.getUserId(), notificationId);
        return ResponseEntity.ok(new SuccessResponse<>("Xoá thông báo thành công", null));
    }

    private void requireAuthenticated(AppUserPrinciple principal) {
        if (principal == null || principal.getUserId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bạn cần đăng nhập");
        }
    }
}

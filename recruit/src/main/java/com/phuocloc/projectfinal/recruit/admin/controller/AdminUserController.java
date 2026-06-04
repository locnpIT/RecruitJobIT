package com.phuocloc.projectfinal.recruit.admin.controller;

import com.phuocloc.projectfinal.recruit.admin.dto.request.UpdateUserStatusRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminUserResponse;
import com.phuocloc.projectfinal.recruit.admin.service.AdminService;
import com.phuocloc.projectfinal.recruit.common.response.SuccessResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
class AdminUserController extends AbstractAdminController {

    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<SuccessResponse<List<AdminUserResponse>>> users(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách người dùng thành công", adminService.listUsers(keyword, role, status)));
    }

    @PatchMapping("/{userId}/status")
    public ResponseEntity<SuccessResponse<AdminUserResponse>> updateUserStatus(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserStatusRequest request
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật trạng thái người dùng thành công", adminService.updateUserStatus(userId, request)));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<SuccessResponse<Void>> deleteUser(@PathVariable Long userId) {
        requireAdmin();
        adminService.deleteUser(userId);
        return ResponseEntity.ok(new SuccessResponse<>("Xoá người dùng thành công", null));
    }
}

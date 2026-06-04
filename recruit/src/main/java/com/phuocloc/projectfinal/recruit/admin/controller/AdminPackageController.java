package com.phuocloc.projectfinal.recruit.admin.controller;

import com.phuocloc.projectfinal.recruit.admin.dto.request.CreatePackageRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.request.UpdatePackageRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminPackageResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminPackageSubscriptionResponse;
import com.phuocloc.projectfinal.recruit.admin.service.AdminService;
import com.phuocloc.projectfinal.recruit.common.response.SuccessResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/packages")
@RequiredArgsConstructor
class AdminPackageController extends AbstractAdminController {

    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<SuccessResponse<List<AdminPackageResponse>>> packages() {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách gói thành công", adminService.listPackages()));
    }

    @GetMapping("/subscriptions")
    public ResponseEntity<SuccessResponse<List<AdminPackageSubscriptionResponse>>> packageSubscriptions() {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách đăng ký gói thành công", adminService.listPackageSubscriptions()));
    }

    @PostMapping
    public ResponseEntity<SuccessResponse<AdminPackageResponse>> createPackage(
            @Valid @RequestBody CreatePackageRequest request
    ) {
        requireAdmin();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SuccessResponse<>(HttpStatus.CREATED, "Tạo gói thành công", adminService.createPackage(request)));
    }

    @PatchMapping("/{packageId}")
    public ResponseEntity<SuccessResponse<AdminPackageResponse>> updatePackage(
            @PathVariable Long packageId,
            @Valid @RequestBody UpdatePackageRequest request
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật gói thành công", adminService.updatePackage(packageId, request)));
    }

    @DeleteMapping("/{packageId}")
    public ResponseEntity<SuccessResponse<Void>> deletePackage(@PathVariable Long packageId) {
        requireAdmin();
        adminService.deletePackage(packageId);
        return ResponseEntity.ok(new SuccessResponse<>("Xoá gói thành công", null));
    }
}

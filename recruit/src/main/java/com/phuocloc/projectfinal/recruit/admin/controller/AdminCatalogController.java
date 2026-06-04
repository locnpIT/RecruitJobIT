package com.phuocloc.projectfinal.recruit.admin.controller;

import com.phuocloc.projectfinal.recruit.admin.dto.request.UpsertCatalogItemRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminCatalogItemResponse;
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
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
class AdminCatalogController extends AbstractAdminController {

    private final AdminService adminService;

    // --- System roles ---

    @GetMapping("/system-roles")
    public ResponseEntity<SuccessResponse<List<AdminCatalogItemResponse>>> systemRoles() {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách vai trò hệ thống thành công", adminService.listSystemRoles()));
    }

    @PostMapping("/system-roles")
    public ResponseEntity<SuccessResponse<AdminCatalogItemResponse>> createSystemRole(
            @Valid @RequestBody UpsertCatalogItemRequest request
    ) {
        requireAdmin();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SuccessResponse<>(HttpStatus.CREATED, "Tạo vai trò hệ thống thành công", adminService.createSystemRole(request)));
    }

    @PatchMapping("/system-roles/{id}")
    public ResponseEntity<SuccessResponse<AdminCatalogItemResponse>> updateSystemRole(
            @PathVariable Long id,
            @Valid @RequestBody UpsertCatalogItemRequest request
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật vai trò hệ thống thành công", adminService.updateSystemRole(id, request)));
    }

    @DeleteMapping("/system-roles/{id}")
    public ResponseEntity<SuccessResponse<Void>> deleteSystemRole(@PathVariable Long id) {
        requireAdmin();
        adminService.deleteSystemRole(id);
        return ResponseEntity.ok(new SuccessResponse<>("Xoá vai trò hệ thống thành công", null));
    }

    // --- Company roles ---

    @GetMapping("/company-roles")
    public ResponseEntity<SuccessResponse<List<AdminCatalogItemResponse>>> companyRoles() {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách vai trò công ty thành công", adminService.listCompanyRoles()));
    }

    @PostMapping("/company-roles")
    public ResponseEntity<SuccessResponse<AdminCatalogItemResponse>> createCompanyRole(
            @Valid @RequestBody UpsertCatalogItemRequest request
    ) {
        requireAdmin();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SuccessResponse<>(HttpStatus.CREATED, "Tạo vai trò công ty thành công", adminService.createCompanyRole(request)));
    }

    @PatchMapping("/company-roles/{id}")
    public ResponseEntity<SuccessResponse<AdminCatalogItemResponse>> updateCompanyRole(
            @PathVariable Long id,
            @Valid @RequestBody UpsertCatalogItemRequest request
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật vai trò công ty thành công", adminService.updateCompanyRole(id, request)));
    }

    @DeleteMapping("/company-roles/{id}")
    public ResponseEntity<SuccessResponse<Void>> deleteCompanyRole(@PathVariable Long id) {
        requireAdmin();
        adminService.deleteCompanyRole(id);
        return ResponseEntity.ok(new SuccessResponse<>("Xoá vai trò công ty thành công", null));
    }

    // --- Proof types ---

    @GetMapping("/proof-types")
    public ResponseEntity<SuccessResponse<List<AdminCatalogItemResponse>>> proofTypes() {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách loại tài liệu thành công", adminService.listProofTypes()));
    }

    @PostMapping("/proof-types")
    public ResponseEntity<SuccessResponse<AdminCatalogItemResponse>> createProofType(
            @Valid @RequestBody UpsertCatalogItemRequest request
    ) {
        requireAdmin();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SuccessResponse<>(HttpStatus.CREATED, "Tạo loại tài liệu thành công", adminService.createProofType(request)));
    }

    @PatchMapping("/proof-types/{id}")
    public ResponseEntity<SuccessResponse<AdminCatalogItemResponse>> updateProofType(
            @PathVariable Long id,
            @Valid @RequestBody UpsertCatalogItemRequest request
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật loại tài liệu thành công", adminService.updateProofType(id, request)));
    }

    @DeleteMapping("/proof-types/{id}")
    public ResponseEntity<SuccessResponse<Void>> deleteProofType(@PathVariable Long id) {
        requireAdmin();
        adminService.deleteProofType(id);
        return ResponseEntity.ok(new SuccessResponse<>("Xoá loại tài liệu thành công", null));
    }

    // --- Certificate types ---

    @GetMapping("/certificate-types")
    public ResponseEntity<SuccessResponse<List<AdminCatalogItemResponse>>> certificateTypes() {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách loại chứng chỉ thành công", adminService.listCertificateTypes()));
    }

    @PostMapping("/certificate-types")
    public ResponseEntity<SuccessResponse<AdminCatalogItemResponse>> createCertificateType(
            @Valid @RequestBody UpsertCatalogItemRequest request
    ) {
        requireAdmin();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SuccessResponse<>(HttpStatus.CREATED, "Tạo loại chứng chỉ thành công", adminService.createCertificateType(request)));
    }

    @PatchMapping("/certificate-types/{id}")
    public ResponseEntity<SuccessResponse<AdminCatalogItemResponse>> updateCertificateType(
            @PathVariable Long id,
            @Valid @RequestBody UpsertCatalogItemRequest request
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật loại chứng chỉ thành công", adminService.updateCertificateType(id, request)));
    }

    @DeleteMapping("/certificate-types/{id}")
    public ResponseEntity<SuccessResponse<Void>> deleteCertificateType(@PathVariable Long id) {
        requireAdmin();
        adminService.deleteCertificateType(id);
        return ResponseEntity.ok(new SuccessResponse<>("Xoá loại chứng chỉ thành công", null));
    }
}

package com.phuocloc.projectfinal.recruit.admin.controller;

import com.phuocloc.projectfinal.recruit.admin.dto.request.AdminCreateCompanyRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.request.AdminUpdateCompanyBranchRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.request.AdminUpdateCompanyRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.request.ReviewCompanyRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminCompanyDetailResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminCompanyResponse;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/companies")
@RequiredArgsConstructor
class AdminCompanyController extends AbstractAdminController {

    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<SuccessResponse<List<AdminCompanyResponse>>> companies(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách công ty thành công", adminService.listCompanies(status, keyword)));
    }

    @PostMapping
    public ResponseEntity<SuccessResponse<AdminCompanyResponse>> createCompany(
            @Valid @RequestBody AdminCreateCompanyRequest request
    ) {
        requireAdmin();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SuccessResponse<>(HttpStatus.CREATED, "Tạo công ty thành công", adminService.createCompany(request)));
    }

    @GetMapping("/{companyId}")
    public ResponseEntity<SuccessResponse<AdminCompanyDetailResponse>> companyDetail(@PathVariable Long companyId) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy chi tiết công ty thành công", adminService.getCompanyDetail(companyId)));
    }

    @PostMapping("/{companyId}/branches")
    public ResponseEntity<SuccessResponse<AdminCompanyDetailResponse>> createCompanyBranch(
            @PathVariable Long companyId,
            @Valid @RequestBody AdminUpdateCompanyBranchRequest request
    ) {
        requireAdmin();
        return ResponseEntity.status(HttpStatus.CREATED).body(new SuccessResponse<>(
                HttpStatus.CREATED,
                "Thêm chi nhánh công ty thành công",
                adminService.createCompanyBranch(companyId, request)
        ));
    }

    @PatchMapping("/{companyId}")
    public ResponseEntity<SuccessResponse<AdminCompanyResponse>> updateCompany(
            @PathVariable Long companyId,
            @Valid @RequestBody AdminUpdateCompanyRequest request
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật công ty thành công", adminService.updateCompany(companyId, request)));
    }

    @DeleteMapping("/{companyId}")
    public ResponseEntity<SuccessResponse<Void>> deleteCompany(@PathVariable Long companyId) {
        requireAdmin();
        adminService.deleteCompany(companyId);
        return ResponseEntity.ok(new SuccessResponse<>("Xoá công ty thành công", null));
    }

    @PatchMapping("/{companyId}/branches/{branchId}")
    public ResponseEntity<SuccessResponse<AdminCompanyDetailResponse>> updateCompanyBranch(
            @PathVariable Long companyId,
            @PathVariable Long branchId,
            @Valid @RequestBody AdminUpdateCompanyBranchRequest request
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>(
                "Cập nhật chi nhánh công ty thành công",
                adminService.updateCompanyBranch(companyId, branchId, request)
        ));
    }

    @DeleteMapping("/{companyId}/branches/{branchId}")
    public ResponseEntity<SuccessResponse<AdminCompanyDetailResponse>> deleteCompanyBranch(
            @PathVariable Long companyId,
            @PathVariable Long branchId
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>(
                "Xoá chi nhánh công ty thành công",
                adminService.deleteCompanyBranch(companyId, branchId)
        ));
    }

    @PatchMapping("/{companyId}/approve")
    public ResponseEntity<SuccessResponse<AdminCompanyResponse>> approveCompany(@PathVariable Long companyId) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Duyệt công ty thành công", adminService.approveCompany(companyId)));
    }

    @PatchMapping("/{companyId}/reject")
    public ResponseEntity<SuccessResponse<AdminCompanyResponse>> rejectCompany(
            @PathVariable Long companyId,
            @Valid @RequestBody ReviewCompanyRequest request
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Từ chối công ty thành công", adminService.rejectCompany(companyId, request)));
    }
}

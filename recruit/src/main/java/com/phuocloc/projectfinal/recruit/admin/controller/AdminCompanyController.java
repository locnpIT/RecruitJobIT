package com.phuocloc.projectfinal.recruit.admin.controller;

import com.phuocloc.projectfinal.recruit.admin.dto.request.ReviewCompanyRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminCompanyDetailResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminCompanyResponse;
import com.phuocloc.projectfinal.recruit.admin.service.AdminService;
import com.phuocloc.projectfinal.recruit.common.response.SuccessResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
            @RequestParam(required = false) String status
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách công ty thành công", adminService.listCompanies(status)));
    }

    @GetMapping("/{companyId}")
    public ResponseEntity<SuccessResponse<AdminCompanyDetailResponse>> companyDetail(@PathVariable Long companyId) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy chi tiết công ty thành công", adminService.getCompanyDetail(companyId)));
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

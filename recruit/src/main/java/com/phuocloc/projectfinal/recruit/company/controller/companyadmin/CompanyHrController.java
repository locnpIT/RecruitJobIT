package com.phuocloc.projectfinal.recruit.company.controller.companyadmin;

import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.common.response.SuccessResponse;
import com.phuocloc.projectfinal.recruit.company.dto.request.CreateCompanyHrRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.UpdateCompanyHrRequest;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyAdminHrResponse;
import com.phuocloc.projectfinal.recruit.company.service.CompanyHrManagementService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Quản lý tài khoản HR trong công ty: xem, tạo, cập nhật và xóa.
 */
@RestController
@RequestMapping("/api/v1/company-admin")
@RequiredArgsConstructor
public class CompanyHrController {

    private final CompanyHrManagementService companyHrManagementService;

    @GetMapping("/hrs")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<SuccessResponse<List<CompanyAdminHrResponse>>> getHrs(
            @AuthenticationPrincipal AppUserPrinciple principal
    ) {
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách HR thành công",
                companyHrManagementService.getHrAccounts(principal.getUserId().intValue())));
    }

    @PostMapping("/hrs")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<SuccessResponse<CompanyAdminHrResponse>> createHr(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @jakarta.validation.Valid @RequestBody CreateCompanyHrRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SuccessResponse<>(HttpStatus.CREATED, "Tạo tài khoản HR thành công",
                        companyHrManagementService.createHrAccount(principal.getUserId().intValue(), request)));
    }

    @PatchMapping("/hrs/{hrUserId}")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<SuccessResponse<CompanyAdminHrResponse>> updateHr(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long hrUserId,
            @jakarta.validation.Valid @RequestBody UpdateCompanyHrRequest request
    ) {
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật tài khoản HR thành công",
                companyHrManagementService.updateHrAccount(principal.getUserId().intValue(), hrUserId, request)));
    }

    @DeleteMapping("/hrs/{hrUserId}")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<SuccessResponse<Void>> deleteHr(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long hrUserId
    ) {
        companyHrManagementService.deleteHrAccount(principal.getUserId().intValue(), hrUserId);
        return ResponseEntity.ok(new SuccessResponse<>("Xoá tài khoản HR thành công", null));
    }
}

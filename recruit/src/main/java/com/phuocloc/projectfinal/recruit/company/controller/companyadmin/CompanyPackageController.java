package com.phuocloc.projectfinal.recruit.company.controller.companyadmin;

import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.common.response.SuccessResponse;
import com.phuocloc.projectfinal.recruit.company.dto.request.RegisterCompanyPackageRequest;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyPackageOverviewResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyPackageRegistrationResponse;
import com.phuocloc.projectfinal.recruit.company.service.CompanyAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Gói dịch vụ công ty: xem danh sách gói và đăng ký gói mới.
 */
@RestController
@RequestMapping("/api/v1/company-admin")
@RequiredArgsConstructor
public class CompanyPackageController {

    private final CompanyAdminService companyAdminService;

    @GetMapping("/packages")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<SuccessResponse<CompanyPackageOverviewResponse>> getPackages(
            @AuthenticationPrincipal AppUserPrinciple principal
    ) {
        return ResponseEntity.ok(new SuccessResponse<>("Lấy thông tin gói công ty thành công",
                companyAdminService.listPackages(principal)));
    }

    @PostMapping("/packages")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<SuccessResponse<CompanyPackageRegistrationResponse>> registerPackage(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @jakarta.validation.Valid @RequestBody RegisterCompanyPackageRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SuccessResponse<>(HttpStatus.CREATED, "Đăng ký gói công ty thành công",
                        companyAdminService.registerPackage(principal, request)));
    }
}

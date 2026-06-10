package com.phuocloc.projectfinal.recruit.company.controller.companyadmin;

import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.common.response.SuccessResponse;
import com.phuocloc.projectfinal.recruit.company.dto.request.CompanyProofUploadBatchRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.UpdateCompanyInfoRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.UpdateCompanyLogoRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.UpdateCompanyProofRequest;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyAdminMeResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyAdminProofResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyProofTypeResponse;
import com.phuocloc.projectfinal.recruit.company.service.CompanyAdminService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Hồ sơ công ty: thông tin, logo, chi nhánh, minh chứng và gửi duyệt lại.
 */
@RestController
@RequestMapping("/api/v1/company-admin")
@RequiredArgsConstructor
public class CompanyProfileController {

    private final CompanyAdminService companyAdminService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<SuccessResponse<CompanyAdminMeResponse>> getMe(
            @AuthenticationPrincipal AppUserPrinciple principal
    ) {
        return ResponseEntity.ok(new SuccessResponse<>("Lấy thông tin quản trị công ty thành công",
                companyAdminService.getMe(principal)));
    }

    @GetMapping("/branches")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<SuccessResponse<List<CompanyAdminMeResponse.ThongTinChiNhanh>>> getBranches(
            @AuthenticationPrincipal AppUserPrinciple principal
    ) {
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách chi nhánh thành công",
                companyAdminService.getBranches(principal)));
    }

    @PatchMapping("/company/logo")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<SuccessResponse<CompanyAdminMeResponse.ThongTinCongTy>> updateCompanyLogo(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @RequestBody UpdateCompanyLogoRequest request
    ) {
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật logo công ty thành công",
                companyAdminService.updateLogo(principal, request)));
    }

    @PatchMapping("/company/info")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<SuccessResponse<CompanyAdminMeResponse.ThongTinCongTy>> updateCompanyInfo(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @jakarta.validation.Valid @RequestBody UpdateCompanyInfoRequest request
    ) {
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật thông tin công ty thành công",
                companyAdminService.updateCompanyInfo(principal, request)));
    }

    @PostMapping("/company/proofs")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<SuccessResponse<CompanyAdminProofResponse>> uploadCompanyProof(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @jakarta.validation.Valid @RequestBody UpdateCompanyProofRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SuccessResponse<>(HttpStatus.CREATED, "Tải lên minh chứng công ty thành công",
                        companyAdminService.uploadProofDocument(principal, request)));
    }

    @PostMapping("/company/proofs/batch")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<SuccessResponse<List<CompanyAdminProofResponse>>> uploadCompanyProofBatch(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @jakarta.validation.Valid @RequestBody CompanyProofUploadBatchRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SuccessResponse<>(HttpStatus.CREATED, "Tải lên danh sách minh chứng công ty thành công",
                        companyAdminService.uploadProofDocuments(principal, request)));
    }

    @GetMapping("/company/proof-types")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<SuccessResponse<List<CompanyProofTypeResponse>>> getCompanyProofTypes() {
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách loại tài liệu thành công",
                companyAdminService.listProofTypes()));
    }

    @PatchMapping("/company/resubmit")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<SuccessResponse<CompanyAdminMeResponse.ThongTinCongTy>> resubmitCompany(
            @AuthenticationPrincipal AppUserPrinciple principal
    ) {
        return ResponseEntity.ok(new SuccessResponse<>("Gửi duyệt lại công ty thành công",
                companyAdminService.resubmitCompany(principal)));
    }
}

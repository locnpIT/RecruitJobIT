package com.phuocloc.projectfinal.recruit.company.controller.companyadmin;

import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.common.response.SuccessResponse;
import com.phuocloc.projectfinal.recruit.company.dto.request.SendInterviewMailRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.UpdateApplicationStatusRequest;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyAdminApplicationResponse;
import com.phuocloc.projectfinal.recruit.company.service.CompanyAdminService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Đơn ứng tuyển: xem, cập nhật trạng thái pipeline và gửi email phỏng vấn.
 */
@RestController
@RequestMapping("/api/v1/company-admin")
@RequiredArgsConstructor
public class CompanyApplicationController {

    private final CompanyAdminService companyAdminService;

    @GetMapping("/applications")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<SuccessResponse<List<CompanyAdminApplicationResponse>>> getApplications(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @RequestParam Integer chiNhanhId
    ) {
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách ứng viên thành công",
                companyAdminService.listApplications(principal, chiNhanhId)));
    }

    @GetMapping("/applications/{applicationId}")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<SuccessResponse<CompanyAdminApplicationResponse>> getApplicationDetail(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long applicationId
    ) {
        return ResponseEntity.ok(new SuccessResponse<>("Lấy chi tiết đơn ứng tuyển thành công",
                companyAdminService.getApplicationDetail(principal, applicationId)));
    }

    @PatchMapping("/applications/{applicationId}/status")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<SuccessResponse<CompanyAdminApplicationResponse>> updateApplicationStatus(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long applicationId,
            @jakarta.validation.Valid @RequestBody UpdateApplicationStatusRequest request
    ) {
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật trạng thái đơn ứng tuyển thành công",
                companyAdminService.updateApplicationStatus(principal, applicationId, request)));
    }

    @PostMapping("/applications/{applicationId}/interview-email")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<SuccessResponse<CompanyAdminApplicationResponse>> sendInterviewEmail(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long applicationId,
            @jakarta.validation.Valid @RequestBody SendInterviewMailRequest request
    ) {
        return ResponseEntity.ok(new SuccessResponse<>("Gửi email phỏng vấn thành công",
                companyAdminService.sendInterviewEmail(principal, applicationId, request)));
    }
}

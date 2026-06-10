package com.phuocloc.projectfinal.recruit.company.controller.companyadmin;

import com.phuocloc.projectfinal.recruit.ai.dto.response.CandidateSemanticMatchResponse;
import com.phuocloc.projectfinal.recruit.ai.service.SemanticMatchingService;
import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.common.response.SuccessResponse;
import com.phuocloc.projectfinal.recruit.company.dto.request.CreateCompanyJobRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.UpdateCompanyJobRequest;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyAdminApplicationResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyAdminJobResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyJobMetadataResponse;
import com.phuocloc.projectfinal.recruit.company.service.CompanyAdminService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Tin tuyển dụng và AI matching theo tin.
 */
@RestController
@RequestMapping("/api/v1/company-admin")
@RequiredArgsConstructor
public class CompanyJobController {

    private final CompanyAdminService companyAdminService;
    private final SemanticMatchingService semanticMatchingService;

    @GetMapping("/jobs")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<SuccessResponse<List<CompanyAdminJobResponse>>> getJobs(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @RequestParam Integer chiNhanhId
    ) {
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách tin tuyển dụng thành công",
                companyAdminService.listJobs(principal, chiNhanhId)));
    }

    @GetMapping("/jobs/metadata")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<SuccessResponse<CompanyJobMetadataResponse>> getJobMetadata() {
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh mục tạo tin tuyển dụng thành công",
                companyAdminService.getJobMetadata()));
    }

    @PostMapping("/jobs")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<SuccessResponse<CompanyAdminJobResponse>> createJob(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @jakarta.validation.Valid @RequestBody CreateCompanyJobRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SuccessResponse<>(HttpStatus.CREATED, "Tạo tin tuyển dụng thành công",
                        companyAdminService.createJob(principal, request)));
    }

    @PatchMapping("/jobs/{jobId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<SuccessResponse<CompanyAdminJobResponse>> updateJob(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long jobId,
            @jakarta.validation.Valid @RequestBody UpdateCompanyJobRequest request
    ) {
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật tin tuyển dụng thành công",
                companyAdminService.updateJob(principal, jobId, request)));
    }

    @DeleteMapping("/jobs/{jobId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<SuccessResponse<Void>> deleteJob(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long jobId
    ) {
        companyAdminService.deleteJob(principal, jobId);
        return ResponseEntity.ok(new SuccessResponse<>("Xoá tin tuyển dụng thành công", null));
    }

    @GetMapping("/jobs/{jobId}/candidate-matches")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<SuccessResponse<List<CandidateSemanticMatchResponse>>> getCandidateMatchesForJob(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long jobId,
            @RequestParam(required = false, defaultValue = "10") Integer limit
    ) {
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách ứng viên phù hợp thành công",
                semanticMatchingService.findMatchingCandidatesForJob(principal, jobId, limit)));
    }

    @GetMapping("/jobs/{jobId}/application-matches")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<SuccessResponse<List<CandidateSemanticMatchResponse>>> getApplicationMatchesForJob(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long jobId,
            @RequestParam(required = false, defaultValue = "10") Integer limit
    ) {
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách đơn ứng tuyển phù hợp thành công",
                semanticMatchingService.findSubmittedApplicationMatchesForJob(principal, jobId, limit)));
    }

    @GetMapping("/jobs/{jobId}/candidate-profiles/{profileId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<SuccessResponse<CompanyAdminApplicationResponse>> getCandidateProfileForJob(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long jobId,
            @PathVariable Long profileId
    ) {
        return ResponseEntity.ok(new SuccessResponse<>("Lấy hồ sơ ứng viên phù hợp thành công",
                companyAdminService.getCandidateProfileForJob(principal, jobId, profileId)));
    }
}

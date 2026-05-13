package com.phuocloc.projectfinal.recruit.candidate.controller;

import com.phuocloc.projectfinal.recruit.auth.enums.RoleName;
import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.CreateJobApplicationRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.response.CandidateJobApplicationResponse;
import com.phuocloc.projectfinal.recruit.candidate.dto.response.CandidateJobApplicationStatusResponse;
import com.phuocloc.projectfinal.recruit.candidate.service.CandidateJobApplicationService;
import com.phuocloc.projectfinal.recruit.common.response.SuccessResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/candidate/applications")
@RequiredArgsConstructor
/**
 * API ứng tuyển dành cho candidate.
 *
 * <p>Controller chỉ điều phối request/response và kiểm tra role.
 * Rule nghiệp vụ chọn hồ sơ/bắt buộc CV nằm trong {@link CandidateJobApplicationService}.</p>
 */
public class CandidateJobApplicationController {

    private final CandidateJobApplicationService applicationService;

    @GetMapping
    // Lấy danh sách các đơn ứng tuyển của candidate hiện tại.
    public ResponseEntity<SuccessResponse<List<CandidateJobApplicationResponse>>> listMyApplications(
            @AuthenticationPrincipal AppUserPrinciple principal
    ) {
        requireCandidate(principal);
        return ResponseEntity.ok(new SuccessResponse<>(
                "Lấy danh sách đơn ứng tuyển thành công",
                applicationService.listMyApplications(principal.getUserId())
        ));
    }

    @GetMapping("/jobs/{jobId}/status")
    // Kiểm tra candidate đã ứng tuyển một tin cụ thể hay chưa để frontend disable nút ứng tuyển.
    public ResponseEntity<SuccessResponse<CandidateJobApplicationStatusResponse>> getApplicationStatus(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long jobId
    ) {
        requireCandidate(principal);
        return ResponseEntity.ok(new SuccessResponse<>(
                "Lấy trạng thái ứng tuyển thành công",
                applicationService.getStatus(principal.getUserId(), jobId)
        ));
    }

    @PostMapping("/jobs/{jobId}")
    // Tạo đơn ứng tuyển cho một tin public.
    // Nếu tin bắt buộc CV thì request phải có cvUrl đã upload lên Cloudinary.
    public ResponseEntity<SuccessResponse<CandidateJobApplicationResponse>> apply(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long jobId,
            @RequestBody CreateJobApplicationRequest request
    ) {
        requireCandidate(principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(new SuccessResponse<>(
                HttpStatus.CREATED,
                "Ứng tuyển thành công",
                applicationService.apply(principal.getUserId(), jobId, request)
        ));
    }

    private void requireCandidate(AppUserPrinciple principal) {
        if (principal == null || principal.getRole() != RoleName.CANDIDATE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ ứng viên được thực hiện thao tác này");
        }
    }
}

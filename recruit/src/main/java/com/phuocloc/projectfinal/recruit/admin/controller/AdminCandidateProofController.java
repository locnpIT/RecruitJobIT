package com.phuocloc.projectfinal.recruit.admin.controller;

import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminCandidateProofResponse;
import com.phuocloc.projectfinal.recruit.admin.service.AdminService;
import com.phuocloc.projectfinal.recruit.common.response.SuccessResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/candidate-proofs")
@RequiredArgsConstructor
class AdminCandidateProofController extends AbstractAdminController {

    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<SuccessResponse<List<AdminCandidateProofResponse>>> candidateProofs(
            @RequestParam(required = false, defaultValue = "PENDING") String status
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách minh chứng ứng viên thành công", adminService.listCandidateProofs(status)));
    }

    @PatchMapping("/{type}/{proofId}/approve")
    public ResponseEntity<SuccessResponse<AdminCandidateProofResponse>> approveCandidateProof(
            @PathVariable String type,
            @PathVariable Long proofId
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Duyệt minh chứng ứng viên thành công", adminService.approveCandidateProof(type, proofId)));
    }

    @PatchMapping("/{type}/{proofId}/reject")
    public ResponseEntity<SuccessResponse<AdminCandidateProofResponse>> rejectCandidateProof(
            @PathVariable String type,
            @PathVariable Long proofId
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Từ chối minh chứng ứng viên thành công", adminService.rejectCandidateProof(type, proofId)));
    }
}

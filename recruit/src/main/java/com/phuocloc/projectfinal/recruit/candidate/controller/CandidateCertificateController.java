package com.phuocloc.projectfinal.recruit.candidate.controller;

import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.ToggleProfileItemSelectionRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.UpsertChungChiRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.response.CandidateProfileResponse;
import com.phuocloc.projectfinal.recruit.candidate.dto.response.ProfileItemSelectionResponse;
import com.phuocloc.projectfinal.recruit.candidate.service.CandidateProfileService;
import com.phuocloc.projectfinal.recruit.common.response.SuccessResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/candidate/profile")
@RequiredArgsConstructor
/**
 * CRUD chứng chỉ của hồ sơ ứng viên.
 */
public class CandidateCertificateController {

    private final CandidateProfileService candidateProfileService;

    @PostMapping("/certificates")
    public ResponseEntity<SuccessResponse<CandidateProfileResponse.ChungChiItem>> createCertificate(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @Valid @RequestBody UpsertChungChiRequest request
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.createChungChi(principal.getUserId(), request);
        return ResponseEntity.ok(new SuccessResponse<>("Tạo chứng chỉ thành công", data));
    }

    @PostMapping("/{profileId}/certificates")
    public ResponseEntity<SuccessResponse<CandidateProfileResponse.ChungChiItem>> createCertificateByProfile(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long profileId,
            @Valid @RequestBody UpsertChungChiRequest request
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.createChungChi(principal.getUserId(), profileId, request);
        return ResponseEntity.ok(new SuccessResponse<>("Tạo chứng chỉ thành công", data));
    }

    @PatchMapping("/certificates/{certificateId}")
    public ResponseEntity<SuccessResponse<CandidateProfileResponse.ChungChiItem>> updateCertificate(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long certificateId,
            @Valid @RequestBody UpsertChungChiRequest request
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.updateChungChi(principal.getUserId(), certificateId, request);
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật chứng chỉ thành công", data));
    }

    @PatchMapping("/{profileId}/certificates/{certificateId}")
    public ResponseEntity<SuccessResponse<CandidateProfileResponse.ChungChiItem>> updateCertificateByProfile(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long profileId,
            @PathVariable Long certificateId,
            @Valid @RequestBody UpsertChungChiRequest request
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.updateChungChi(principal.getUserId(), profileId, certificateId, request);
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật chứng chỉ thành công", data));
    }

    @DeleteMapping("/certificates/{certificateId}")
    public ResponseEntity<SuccessResponse<Void>> deleteCertificate(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long certificateId
    ) {
        requireCandidate(principal);
        candidateProfileService.deleteChungChi(principal.getUserId(), certificateId);
        return ResponseEntity.ok(new SuccessResponse<>("Xoá chứng chỉ thành công", null));
    }

    @DeleteMapping("/{profileId}/certificates/{certificateId}")
    public ResponseEntity<SuccessResponse<Void>> deleteCertificateByProfile(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long profileId,
            @PathVariable Long certificateId
    ) {
        requireCandidate(principal);
        candidateProfileService.deleteChungChi(principal.getUserId(), profileId, certificateId);
        return ResponseEntity.ok(new SuccessResponse<>("Xoá chứng chỉ thành công", null));
    }

    @PutMapping("/{profileId}/certificates/{certificateId}/selection")
    public ResponseEntity<SuccessResponse<ProfileItemSelectionResponse>> updateCertificateSelection(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long profileId,
            @PathVariable Long certificateId,
            @Valid @RequestBody ToggleProfileItemSelectionRequest request
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.updateChungChiSelection(principal.getUserId(), profileId, certificateId, request);
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật hiển thị chứng chỉ thành công", data));
    }

    private void requireCandidate(AppUserPrinciple principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chưa đăng nhập");
        }
    }
}

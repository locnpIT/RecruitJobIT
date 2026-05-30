package com.phuocloc.projectfinal.recruit.candidate.controller;

import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.ToggleProfileItemSelectionRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.UpsertHocVanRequest;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/candidate/profile")
@RequiredArgsConstructor
/**
 * CRUD học vấn của hồ sơ ứng viên.
 */
public class CandidateEducationController {

    private final CandidateProfileService candidateProfileService;

    @PostMapping("/educations")
    public ResponseEntity<SuccessResponse<CandidateProfileResponse.HocVanItem>> createEducation(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @Valid @RequestBody UpsertHocVanRequest request
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.createHocVan(principal.getUserId(), request);
        return ResponseEntity.ok(new SuccessResponse<>("Tạo học vấn thành công", data));
    }

    @PostMapping("/{profileId}/educations")
    public ResponseEntity<SuccessResponse<CandidateProfileResponse.HocVanItem>> createEducationByProfile(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long profileId,
            @Valid @RequestBody UpsertHocVanRequest request
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.createHocVan(principal.getUserId(), profileId, request);
        return ResponseEntity.ok(new SuccessResponse<>("Tạo học vấn thành công", data));
    }

    @PatchMapping("/educations/{educationId}")
    public ResponseEntity<SuccessResponse<CandidateProfileResponse.HocVanItem>> updateEducation(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long educationId,
            @Valid @RequestBody UpsertHocVanRequest request
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.updateHocVan(principal.getUserId(), educationId, request);
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật học vấn thành công", data));
    }

    @PatchMapping("/{profileId}/educations/{educationId}")
    public ResponseEntity<SuccessResponse<CandidateProfileResponse.HocVanItem>> updateEducationByProfile(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long profileId,
            @PathVariable Long educationId,
            @Valid @RequestBody UpsertHocVanRequest request
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.updateHocVan(principal.getUserId(), profileId, educationId, request);
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật học vấn thành công", data));
    }

    @DeleteMapping("/educations/{educationId}")
    public ResponseEntity<SuccessResponse<Void>> deleteEducation(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long educationId
    ) {
        requireCandidate(principal);
        candidateProfileService.deleteHocVan(principal.getUserId(), educationId);
        return ResponseEntity.ok(new SuccessResponse<>("Xoá học vấn thành công", null));
    }

    @DeleteMapping("/{profileId}/educations/{educationId}")
    public ResponseEntity<SuccessResponse<Void>> deleteEducationByProfile(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long profileId,
            @PathVariable Long educationId
    ) {
        requireCandidate(principal);
        candidateProfileService.deleteHocVan(principal.getUserId(), profileId, educationId);
        return ResponseEntity.ok(new SuccessResponse<>("Xoá học vấn thành công", null));
    }

    @PutMapping("/{profileId}/educations/{educationId}/selection")
    public ResponseEntity<SuccessResponse<ProfileItemSelectionResponse>> updateEducationSelection(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long profileId,
            @PathVariable Long educationId,
            @Valid @RequestBody ToggleProfileItemSelectionRequest request
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.updateHocVanSelection(principal.getUserId(), profileId, educationId, request);
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật hiển thị học vấn thành công", data));
    }

    private void requireCandidate(AppUserPrinciple principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chưa đăng nhập");
        }
    }
}

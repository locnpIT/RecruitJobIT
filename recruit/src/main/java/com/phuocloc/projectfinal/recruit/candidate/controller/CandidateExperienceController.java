package com.phuocloc.projectfinal.recruit.candidate.controller;

import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.ToggleProfileItemSelectionRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.UpsertKinhNghiemLamViecRequest;
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
 * CRUD kinh nghiệm làm việc của hồ sơ ứng viên.
 */
public class CandidateExperienceController {

    private final CandidateProfileService candidateProfileService;

    @Deprecated(since = "2026-06", forRemoval = false)
    @PostMapping("/experiences")
    public ResponseEntity<SuccessResponse<CandidateProfileResponse.KinhNghiemItem>> createExperience(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @Valid @RequestBody UpsertKinhNghiemLamViecRequest request
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.createKinhNghiem(principal.getUserId(), request);
        return ResponseEntity.ok(new SuccessResponse<>("Tạo kinh nghiệm làm việc thành công", data));
    }

    @PostMapping("/{profileId}/experiences")
    public ResponseEntity<SuccessResponse<CandidateProfileResponse.KinhNghiemItem>> createExperienceByProfile(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long profileId,
            @Valid @RequestBody UpsertKinhNghiemLamViecRequest request
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.createKinhNghiem(principal.getUserId(), profileId, request);
        return ResponseEntity.ok(new SuccessResponse<>("Tạo kinh nghiệm làm việc thành công", data));
    }

    @Deprecated(since = "2026-06", forRemoval = false)
    @PatchMapping("/experiences/{experienceId}")
    public ResponseEntity<SuccessResponse<CandidateProfileResponse.KinhNghiemItem>> updateExperience(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long experienceId,
            @Valid @RequestBody UpsertKinhNghiemLamViecRequest request
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.updateKinhNghiem(principal.getUserId(), experienceId, request);
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật kinh nghiệm làm việc thành công", data));
    }

    @PatchMapping("/{profileId}/experiences/{experienceId}")
    public ResponseEntity<SuccessResponse<CandidateProfileResponse.KinhNghiemItem>> updateExperienceByProfile(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long profileId,
            @PathVariable Long experienceId,
            @Valid @RequestBody UpsertKinhNghiemLamViecRequest request
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.updateKinhNghiem(principal.getUserId(), profileId, experienceId, request);
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật kinh nghiệm làm việc thành công", data));
    }

    @Deprecated(since = "2026-06", forRemoval = false)
    @DeleteMapping("/experiences/{experienceId}")
    public ResponseEntity<SuccessResponse<Void>> deleteExperience(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long experienceId
    ) {
        requireCandidate(principal);
        candidateProfileService.deleteKinhNghiem(principal.getUserId(), experienceId);
        return ResponseEntity.ok(new SuccessResponse<>("Xoá kinh nghiệm làm việc thành công", null));
    }

    @DeleteMapping("/{profileId}/experiences/{experienceId}")
    public ResponseEntity<SuccessResponse<Void>> deleteExperienceByProfile(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long profileId,
            @PathVariable Long experienceId
    ) {
        requireCandidate(principal);
        candidateProfileService.deleteKinhNghiem(principal.getUserId(), profileId, experienceId);
        return ResponseEntity.ok(new SuccessResponse<>("Xoá kinh nghiệm làm việc thành công", null));
    }

    @PutMapping("/{profileId}/experiences/{experienceId}/selection")
    public ResponseEntity<SuccessResponse<ProfileItemSelectionResponse>> updateExperienceSelection(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long profileId,
            @PathVariable Long experienceId,
            @Valid @RequestBody ToggleProfileItemSelectionRequest request
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.updateKinhNghiemSelection(principal.getUserId(), profileId, experienceId, request);
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật hiển thị kinh nghiệm thành công", data));
    }

    private void requireCandidate(AppUserPrinciple principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chưa đăng nhập");
        }
    }
}

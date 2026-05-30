package com.phuocloc.projectfinal.recruit.candidate.controller;

import com.phuocloc.projectfinal.recruit.ai.dto.response.JobSemanticMatchResponse;
import com.phuocloc.projectfinal.recruit.ai.service.SemanticMatchingService;
import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.CreateCandidateProfileRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.UpdateCandidateSummaryRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.UpdateKyNangUngVienRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.UpdateNganhNgheUngVienRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.response.CandidateProfileListItemResponse;
import com.phuocloc.projectfinal.recruit.candidate.dto.response.CandidateProfileMetadataResponse;
import com.phuocloc.projectfinal.recruit.candidate.dto.response.CandidateProfileResponse;
import com.phuocloc.projectfinal.recruit.candidate.service.CandidateProfileService;
import com.phuocloc.projectfinal.recruit.common.response.SuccessResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/candidate/profile")
@RequiredArgsConstructor
/**
 * API tổng quan hồ sơ ứng viên: profile, metadata, summary, kỹ năng và ngành nghề.
 */
public class CandidateProfileController {

    private final CandidateProfileService candidateProfileService;
    private final SemanticMatchingService semanticMatchingService;

    @GetMapping("/all")
    public ResponseEntity<SuccessResponse<List<CandidateProfileListItemResponse>>> listProfiles(
            @AuthenticationPrincipal AppUserPrinciple principal
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.listProfiles(principal.getUserId());
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách hồ sơ ứng viên thành công", data));
    }

    @PostMapping("/all")
    public ResponseEntity<SuccessResponse<CandidateProfileListItemResponse>> createProfile(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @RequestBody(required = false) CreateCandidateProfileRequest request
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.createProfile(principal.getUserId(), request);
        return ResponseEntity.ok(new SuccessResponse<>("Tạo hồ sơ ứng viên thành công", data));
    }

    @GetMapping("/recommended-jobs")
    public ResponseEntity<SuccessResponse<List<JobSemanticMatchResponse>>> getRecommendedJobs(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @RequestParam(required = false, defaultValue = "6") Integer limit
    ) {
        requireCandidate(principal);
        Long profileId = candidateProfileService.findLatestProfileIdOrNull(principal.getUserId());
        if (profileId == null) {
            return ResponseEntity.ok(new SuccessResponse<>("Ứng viên chưa có hồ sơ để gợi ý việc làm", List.of()));
        }
        var data = semanticMatchingService.findMatchingJobsForProfile(principal.getUserId(), profileId, limit);
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách việc làm phù hợp thành công", data));
    }

    @GetMapping("/{profileId}")
    public ResponseEntity<SuccessResponse<CandidateProfileResponse>> getProfileById(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long profileId
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.getProfileById(principal.getUserId(), profileId);
        return ResponseEntity.ok(new SuccessResponse<>("Lấy chi tiết hồ sơ ứng viên thành công", data));
    }

    @GetMapping("/{profileId}/job-matches")
    public ResponseEntity<SuccessResponse<List<JobSemanticMatchResponse>>> getJobMatchesByProfile(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long profileId,
            @RequestParam(required = false, defaultValue = "10") Integer limit
    ) {
        requireCandidate(principal);
        var data = semanticMatchingService.findMatchingJobsForProfile(principal.getUserId(), profileId, limit);
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách việc làm phù hợp thành công", data));
    }

    @PostMapping("/{profileId}/sync-index")
    public ResponseEntity<SuccessResponse<CandidateProfileResponse>> syncProfileIndex(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long profileId
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.syncProfileIndex(principal.getUserId(), profileId);
        return ResponseEntity.ok(new SuccessResponse<>("Đã đồng bộ hồ sơ vào AI Matching", data));
    }

    @GetMapping
    public ResponseEntity<SuccessResponse<CandidateProfileResponse>> getProfile(
            @AuthenticationPrincipal AppUserPrinciple principal
    ) {
        requireCandidate(principal);
        CandidateProfileResponse data = candidateProfileService.getProfile(principal.getUserId());
        return ResponseEntity.ok(new SuccessResponse<>("Lấy hồ sơ ứng viên thành công", data));
    }

    @PostMapping("/sync-index")
    public ResponseEntity<SuccessResponse<CandidateProfileResponse>> syncDefaultProfileIndex(
            @AuthenticationPrincipal AppUserPrinciple principal
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.syncProfileIndex(principal.getUserId(), null);
        return ResponseEntity.ok(new SuccessResponse<>("Đã đồng bộ hồ sơ vào AI Matching", data));
    }

    @GetMapping("/metadata")
    public ResponseEntity<SuccessResponse<CandidateProfileMetadataResponse>> getMetadata(
            @AuthenticationPrincipal AppUserPrinciple principal
    ) {
        requireCandidate(principal);
        CandidateProfileMetadataResponse data = candidateProfileService.getMetadata();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh mục hồ sơ ứng viên thành công", data));
    }

    @PutMapping("/skills")
    public ResponseEntity<SuccessResponse<List<CandidateProfileResponse.KyNangItem>>> updateSkills(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @Valid @RequestBody UpdateKyNangUngVienRequest request
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.updateSkills(principal.getUserId(), request);
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật kỹ năng thành công", data));
    }

    @PutMapping("/{profileId}/skills")
    public ResponseEntity<SuccessResponse<List<CandidateProfileResponse.KyNangItem>>> updateSkillsByProfile(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long profileId,
            @Valid @RequestBody UpdateKyNangUngVienRequest request
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.updateSkills(principal.getUserId(), profileId, request);
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật kỹ năng thành công", data));
    }

    @PutMapping("/industries")
    public ResponseEntity<SuccessResponse<List<CandidateProfileResponse.NganhNgheItem>>> updateIndustries(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @Valid @RequestBody UpdateNganhNgheUngVienRequest request
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.updateIndustries(principal.getUserId(), request);
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật ngành nghề thành công", data));
    }

    @PutMapping("/{profileId}/industries")
    public ResponseEntity<SuccessResponse<List<CandidateProfileResponse.NganhNgheItem>>> updateIndustriesByProfile(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long profileId,
            @Valid @RequestBody UpdateNganhNgheUngVienRequest request
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.updateIndustries(principal.getUserId(), profileId, request);
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật ngành nghề thành công", data));
    }

    @PatchMapping("/summary")
    public ResponseEntity<SuccessResponse<CandidateProfileResponse>> updateSummary(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @RequestBody UpdateCandidateSummaryRequest request
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.updateSummary(principal.getUserId(), request);
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật phần giới thiệu thành công", data));
    }

    @PatchMapping("/{profileId}/summary")
    public ResponseEntity<SuccessResponse<CandidateProfileResponse>> updateSummaryByProfile(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long profileId,
            @RequestBody UpdateCandidateSummaryRequest request
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.updateSummary(principal.getUserId(), profileId, request);
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật phần giới thiệu thành công", data));
    }

    private void requireCandidate(AppUserPrinciple principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chưa đăng nhập");
        }
    }
}

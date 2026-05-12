package com.phuocloc.projectfinal.recruit.candidate.controller;

import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.UpdateKyNangUngVienRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.CreateCandidateProfileRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.UpdateCandidateSummaryRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.UpsertChungChiRequest;
import com.phuocloc.projectfinal.recruit.candidate.dto.request.UpsertHocVanRequest;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
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
 * Candidate Profile API.
 *
 * <p>Nhóm API quản lý hồ sơ ứng viên: danh sách hồ sơ, hồ sơ chi tiết,
 * học vấn, chứng chỉ, kỹ năng và phần giới thiệu/mục tiêu nghề nghiệp.</p>
 */
public class CandidateProfileController {

    private final CandidateProfileService candidateProfileService;

    @GetMapping("/all")
    public ResponseEntity<SuccessResponse<List<CandidateProfileListItemResponse>>> listProfiles(
            @AuthenticationPrincipal AppUserPrinciple principal
    ) {
        // Endpoint phục vụ UI chọn "Hồ sơ #1, #2..." (multi-profile).
        requireCandidate(principal);
        var data = candidateProfileService.listProfiles(principal.getUserId());
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách hồ sơ ứng viên thành công", data));
    }

    @PostMapping("/all")
    public ResponseEntity<SuccessResponse<CandidateProfileListItemResponse>> createProfile(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @RequestBody CreateCandidateProfileRequest request
    ) {
        // Tạo thêm hồ sơ mới cho cùng một candidate user.
        requireCandidate(principal);
        var data = candidateProfileService.createProfile(principal.getUserId(), request);
        return ResponseEntity.ok(new SuccessResponse<>("Tạo hồ sơ ứng viên thành công", data));
    }

    @GetMapping("/{profileId}")
    // Lấy chi tiết một hồ sơ ứng viên cụ thể theo profileId.
    // Frontend gọi route này khi user chuyển giữa các hồ sơ trong selector profile.
    public ResponseEntity<SuccessResponse<CandidateProfileResponse>> getProfileById(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long profileId
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.getProfileById(principal.getUserId(), profileId);
        return ResponseEntity.ok(new SuccessResponse<>("Lấy chi tiết hồ sơ ứng viên thành công", data));
    }

    @GetMapping
    // Lấy hồ sơ mặc định của candidate.
    // Route này chủ yếu để tương thích ngược với flow cũ trước khi có multi-profile.
    public ResponseEntity<SuccessResponse<CandidateProfileResponse>> getProfile(
            @AuthenticationPrincipal AppUserPrinciple principal
    ) {
        requireCandidate(principal);
        CandidateProfileResponse data = candidateProfileService.getProfile(principal.getUserId());
        return ResponseEntity.ok(new SuccessResponse<>("Lấy hồ sơ ứng viên thành công", data));
    }

    @GetMapping("/metadata")
    public ResponseEntity<SuccessResponse<CandidateProfileMetadataResponse>> getMetadata(
            @AuthenticationPrincipal AppUserPrinciple principal
    ) {
        // Trả về danh mục tĩnh để frontend render select/tag.
        requireCandidate(principal);
        CandidateProfileMetadataResponse data = candidateProfileService.getMetadata();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh mục hồ sơ ứng viên thành công", data));
    }

    @PostMapping("/educations")
    // Thêm một dòng học vấn vào hồ sơ mặc định của candidate hiện tại.
    public ResponseEntity<SuccessResponse<CandidateProfileResponse.HocVanItem>> createEducation(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @Valid @RequestBody UpsertHocVanRequest request
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.createHocVan(principal.getUserId(), request);
        return ResponseEntity.ok(new SuccessResponse<>("Tạo học vấn thành công", data));
    }

    @PostMapping("/{profileId}/educations")
    // Thêm học vấn vào đúng hồ sơ được chọn theo profileId.
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
    // Cập nhật một bản ghi học vấn trong hồ sơ mặc định.
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
    // Cập nhật học vấn theo profileId để đảm bảo frontend không sửa nhầm hồ sơ khác.
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
    // Xóa học vấn khỏi hồ sơ mặc định của candidate hiện tại.
    public ResponseEntity<SuccessResponse<Void>> deleteEducation(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long educationId
    ) {
        requireCandidate(principal);
        candidateProfileService.deleteHocVan(principal.getUserId(), educationId);
        return ResponseEntity.ok(new SuccessResponse<>("Xoá học vấn thành công", null));
    }

    @DeleteMapping("/{profileId}/educations/{educationId}")
    // Xóa học vấn thuộc đúng hồ sơ được chọn.
    public ResponseEntity<SuccessResponse<Void>> deleteEducationByProfile(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long profileId,
            @PathVariable Long educationId
    ) {
        requireCandidate(principal);
        candidateProfileService.deleteHocVan(principal.getUserId(), profileId, educationId);
        return ResponseEntity.ok(new SuccessResponse<>("Xoá học vấn thành công", null));
    }

    @PostMapping("/certificates")
    // Thêm chứng chỉ vào hồ sơ mặc định.
    public ResponseEntity<SuccessResponse<CandidateProfileResponse.ChungChiItem>> createCertificate(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @Valid @RequestBody UpsertChungChiRequest request
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.createChungChi(principal.getUserId(), request);
        return ResponseEntity.ok(new SuccessResponse<>("Tạo chứng chỉ thành công", data));
    }

    @PostMapping("/{profileId}/certificates")
    // Thêm chứng chỉ vào hồ sơ cụ thể theo profileId.
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
    // Cập nhật chứng chỉ trong hồ sơ mặc định.
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
    // Cập nhật chứng chỉ thuộc hồ sơ đang chọn.
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
    // Xóa chứng chỉ khỏi hồ sơ mặc định.
    public ResponseEntity<SuccessResponse<Void>> deleteCertificate(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long certificateId
    ) {
        requireCandidate(principal);
        candidateProfileService.deleteChungChi(principal.getUserId(), certificateId);
        return ResponseEntity.ok(new SuccessResponse<>("Xoá chứng chỉ thành công", null));
    }

    @DeleteMapping("/{profileId}/certificates/{certificateId}")
    // Xóa chứng chỉ khỏi hồ sơ cụ thể theo profileId.
    public ResponseEntity<SuccessResponse<Void>> deleteCertificateByProfile(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long profileId,
            @PathVariable Long certificateId
    ) {
        requireCandidate(principal);
        candidateProfileService.deleteChungChi(principal.getUserId(), profileId, certificateId);
        return ResponseEntity.ok(new SuccessResponse<>("Xoá chứng chỉ thành công", null));
    }

    @PutMapping("/skills")
    public ResponseEntity<SuccessResponse<List<CandidateProfileResponse.KyNangItem>>> updateSkills(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @Valid @RequestBody UpdateKyNangUngVienRequest request
    ) {
        // Luồng cập nhật kỹ năng theo kiểu replace-all.
        requireCandidate(principal);
        var data = candidateProfileService.updateSkills(principal.getUserId(), request);
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật kỹ năng thành công", data));
    }

    @PutMapping("/{profileId}/skills")
    // Cập nhật toàn bộ kỹ năng cho hồ sơ được chọn.
    public ResponseEntity<SuccessResponse<List<CandidateProfileResponse.KyNangItem>>> updateSkillsByProfile(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long profileId,
            @Valid @RequestBody UpdateKyNangUngVienRequest request
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.updateSkills(principal.getUserId(), profileId, request);
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật kỹ năng thành công", data));
    }

    @PatchMapping("/summary")
    // Cập nhật phần giới thiệu bản thân + mục tiêu nghề nghiệp của hồ sơ mặc định.
    public ResponseEntity<SuccessResponse<CandidateProfileResponse>> updateSummary(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @RequestBody UpdateCandidateSummaryRequest request
    ) {
        requireCandidate(principal);
        var data = candidateProfileService.updateSummary(principal.getUserId(), request);
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật phần giới thiệu thành công", data));
    }

    @PatchMapping("/{profileId}/summary")
    // Cập nhật phần summary cho đúng hồ sơ được chọn trên UI.
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
        // SecurityConfig/JWT đã xác thực role; controller chặn thêm trường hợp chưa có principal.
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chưa đăng nhập");
        }
    }
}

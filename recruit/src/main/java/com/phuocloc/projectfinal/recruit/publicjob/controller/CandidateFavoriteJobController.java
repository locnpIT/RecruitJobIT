package com.phuocloc.projectfinal.recruit.publicjob.controller;

import com.phuocloc.projectfinal.recruit.auth.enums.RoleName;
import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.common.response.SuccessResponse;
import com.phuocloc.projectfinal.recruit.publicjob.dto.response.FavoriteJobStatusResponse;
import com.phuocloc.projectfinal.recruit.publicjob.dto.response.PublicJobSummaryResponse;
import com.phuocloc.projectfinal.recruit.publicjob.service.CandidateFavoriteJobService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/candidate/favorite-jobs")
@RequiredArgsConstructor
/**
 * API danh sách yêu thích của ứng viên.
 *
 * <p>Chỉ role CANDIDATE được thao tác. Bảng lưu trữ là
 * {@code NguoiDungTinTuyenDung}, đúng với quyết định PM: quan hệ user-job này
 * đại diện cho "tin tuyển dụng yêu thích".</p>
 */
public class CandidateFavoriteJobController {

    private final CandidateFavoriteJobService favoriteJobService;

    @GetMapping
    // Lấy toàn bộ tin tuyển dụng ứng viên đã yêu thích.
    public ResponseEntity<SuccessResponse<List<PublicJobSummaryResponse>>> listFavorites(
            @AuthenticationPrincipal AppUserPrinciple principal
    ) {
        requireCandidate(principal);
        return ResponseEntity.ok(new SuccessResponse<>(
                "Lấy danh sách tin yêu thích thành công",
                favoriteJobService.listFavorites(principal.getUserId())
        ));
    }

    @GetMapping("/{jobId}/status")
    // Kiểm tra một tin hiện có nằm trong danh sách yêu thích của ứng viên hay không.
    public ResponseEntity<SuccessResponse<FavoriteJobStatusResponse>> getFavoriteStatus(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long jobId
    ) {
        requireCandidate(principal);
        return ResponseEntity.ok(new SuccessResponse<>(
                "Lấy trạng thái yêu thích thành công",
                favoriteJobService.getStatus(principal.getUserId(), jobId)
        ));
    }

    @PostMapping("/{jobId}")
    // Thêm tin vào danh sách yêu thích. Nếu đã tồn tại thì trả về favorite=true, không tạo trùng.
    public ResponseEntity<SuccessResponse<FavoriteJobStatusResponse>> addFavorite(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long jobId
    ) {
        requireCandidate(principal);
        return ResponseEntity.ok(new SuccessResponse<>(
                "Đã lưu tin tuyển dụng vào yêu thích",
                favoriteJobService.addFavorite(principal.getUserId(), jobId)
        ));
    }

    @DeleteMapping("/{jobId}")
    // Bỏ tin khỏi danh sách yêu thích của ứng viên.
    public ResponseEntity<SuccessResponse<FavoriteJobStatusResponse>> removeFavorite(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long jobId
    ) {
        requireCandidate(principal);
        return ResponseEntity.ok(new SuccessResponse<>(
                "Đã bỏ tin tuyển dụng khỏi yêu thích",
                favoriteJobService.removeFavorite(principal.getUserId(), jobId)
        ));
    }

    private void requireCandidate(AppUserPrinciple principal) {
        if (principal == null || principal.getRole() != RoleName.CANDIDATE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ ứng viên được dùng chức năng yêu thích");
        }
    }
}

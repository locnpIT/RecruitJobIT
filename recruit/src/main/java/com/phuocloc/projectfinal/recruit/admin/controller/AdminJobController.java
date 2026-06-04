package com.phuocloc.projectfinal.recruit.admin.controller;

import com.phuocloc.projectfinal.recruit.admin.dto.request.ReviewJobRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminJobDetailResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminJobResponse;
import com.phuocloc.projectfinal.recruit.admin.service.AdminService;
import com.phuocloc.projectfinal.recruit.common.response.SuccessResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/jobs")
@RequiredArgsConstructor
class AdminJobController extends AbstractAdminController {

    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<SuccessResponse<List<AdminJobResponse>>> jobs(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String company,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String industry,
            @RequestParam(required = false) String location
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>(
                "Lấy danh sách tin tuyển dụng thành công",
                adminService.listJobs(keyword, company, status, industry, location)));
    }

    @GetMapping("/{jobId}")
    public ResponseEntity<SuccessResponse<AdminJobDetailResponse>> jobDetail(@PathVariable Long jobId) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy chi tiết tin tuyển dụng thành công", adminService.getJobDetail(jobId)));
    }

    @PatchMapping("/{jobId}/approve")
    public ResponseEntity<SuccessResponse<AdminJobResponse>> approveJob(@PathVariable Long jobId) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Duyệt tin tuyển dụng thành công", adminService.approveJob(jobId)));
    }

    @PatchMapping("/{jobId}/reject")
    public ResponseEntity<SuccessResponse<AdminJobResponse>> rejectJob(
            @PathVariable Long jobId,
            @Valid @RequestBody ReviewJobRequest request
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Từ chối tin tuyển dụng thành công", adminService.rejectJob(jobId, request)));
    }

    @PatchMapping("/{jobId}/hide")
    public ResponseEntity<SuccessResponse<AdminJobResponse>> hideJob(@PathVariable Long jobId) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Ẩn tin tuyển dụng thành công", adminService.hideJob(jobId)));
    }
}

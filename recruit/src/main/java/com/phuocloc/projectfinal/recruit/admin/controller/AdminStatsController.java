package com.phuocloc.projectfinal.recruit.admin.controller;

import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminDashboardStatsResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminReportResponse;
import com.phuocloc.projectfinal.recruit.admin.service.AdminService;
import com.phuocloc.projectfinal.recruit.common.response.SuccessResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
class AdminStatsController extends AbstractAdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<SuccessResponse<AdminDashboardStatsResponse>> stats() {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy thống kê admin thành công", adminService.getStats()));
    }

    @GetMapping("/reports")
    public ResponseEntity<SuccessResponse<AdminReportResponse>> reports(
            @RequestParam(required = false, defaultValue = "7d") String range
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy báo cáo hệ thống thành công", adminService.getReport(range)));
    }
}

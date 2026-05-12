package com.phuocloc.projectfinal.recruit.admin.controller;

import com.phuocloc.projectfinal.recruit.admin.dto.request.ReviewCompanyRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.request.ReviewJobRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.request.CreatePackageRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.request.UpdatePackageRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.request.UpdateAdminSettingsRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.request.UpdateUserStatusRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminCompanyDetailResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminCompanyResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminCandidateProofResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminDashboardStatsResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminJobDetailResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminJobResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminPackageResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminPackageSubscriptionResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminReportResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminSettingsResponse;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminUserResponse;
import com.phuocloc.projectfinal.recruit.admin.service.AdminService;
import com.phuocloc.projectfinal.recruit.auth.enums.RoleName;
import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.common.response.SuccessResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
/**
 * Admin API entry-point.
 *
 * <p>Controller này expose toàn bộ endpoint khu vực quản trị hệ thống:
 * users, companies, packages, jobs, reports, settings.
 * Mọi endpoint đều yêu cầu quyền ADMIN thông qua {@link #requireAdmin()}.</p>
 */
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    // Trả về bộ số liệu tổng quan cho trang /admin:
    // tổng user, tổng công ty và các chỉ số trạng thái chính để render dashboard cards.
    public ResponseEntity<SuccessResponse<AdminDashboardStatsResponse>> stats() {
        // Dashboard số liệu tổng quan.
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy thống kê admin thành công", adminService.getStats()));
    }

    @GetMapping("/users")
    // Cấp dữ liệu cho màn /admin/users.
    // Hỗ trợ lọc theo từ khóa, role và trạng thái để admin quản lý người dùng hệ thống.
    public ResponseEntity<SuccessResponse<List<AdminUserResponse>>> users(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách người dùng thành công", adminService.listUsers(keyword, role, status)));
    }

    @PatchMapping("/users/{userId}/status")
    // Cập nhật trạng thái hoạt động của user (khóa / kích hoạt lại).
    // Route này được gọi từ action moderation trong bảng user admin.
    public ResponseEntity<SuccessResponse<AdminUserResponse>> updateUserStatus(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserStatusRequest request
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật trạng thái người dùng thành công", adminService.updateUserStatus(userId, request)));
    }

    @DeleteMapping("/users/{userId}")
    // Xóa user khỏi hệ thống từ phía admin.
    // Chỉ dùng cho thao tác quản trị nhạy cảm nên luôn đi qua requireAdmin().
    public ResponseEntity<SuccessResponse<Void>> deleteUser(@PathVariable Long userId) {
        requireAdmin();
        adminService.deleteUser(userId);
        return ResponseEntity.ok(new SuccessResponse<>("Xoá người dùng thành công", null));
    }

    @GetMapping("/companies")
    // Lấy danh sách công ty cho màn /admin/companies.
    // Có thể lọc nhanh theo trạng thái duyệt để phục vụ workflow approval.
    public ResponseEntity<SuccessResponse<List<AdminCompanyResponse>>> companies(
            @RequestParam(required = false) String status
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách công ty thành công", adminService.listCompanies(status)));
    }

    @GetMapping("/companies/{companyId}")
    // Lấy chi tiết một công ty:
    // thông tin công ty, chủ công ty, chi nhánh và minh chứng để admin đánh giá.
    public ResponseEntity<SuccessResponse<AdminCompanyDetailResponse>> companyDetail(@PathVariable Long companyId) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy chi tiết công ty thành công", adminService.getCompanyDetail(companyId)));
    }

    @PatchMapping("/companies/{companyId}/approve")
    // Duyệt công ty.
    // Sau khi duyệt, công ty có thể đi tiếp vào các luồng quản trị và đăng ký gói.
    public ResponseEntity<SuccessResponse<AdminCompanyResponse>> approveCompany(@PathVariable Long companyId) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Duyệt công ty thành công", adminService.approveCompany(companyId)));
    }

    @PatchMapping("/companies/{companyId}/reject")
    // Từ chối công ty và lưu lý do từ chối để owner xem và bổ sung hồ sơ.
    public ResponseEntity<SuccessResponse<AdminCompanyResponse>> rejectCompany(
            @PathVariable Long companyId,
            @Valid @RequestBody ReviewCompanyRequest request
    ) {
        requireAdmin();
        return ResponseEntity.status(HttpStatus.OK)
                .body(new SuccessResponse<>("Từ chối công ty thành công", adminService.rejectCompany(companyId, request)));
    }

    @GetMapping("/packages")
    // Lấy danh sách danh mục gói dịch vụ cho màn /admin/plans.
    public ResponseEntity<SuccessResponse<List<AdminPackageResponse>>> packages() {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách gói thành công", adminService.listPackages()));
    }

    @GetMapping("/packages/subscriptions")
    // Lấy lịch sử đăng ký gói gần đây của các công ty.
    // Mục đích là để admin theo dõi thanh toán/kích hoạt gói trên cùng màn plans.
    public ResponseEntity<SuccessResponse<List<AdminPackageSubscriptionResponse>>> packageSubscriptions() {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách đăng ký gói thành công", adminService.listPackageSubscriptions()));
    }

    @PostMapping("/packages")
    // Tạo gói dịch vụ mới từ admin.
    // Gói này sẽ xuất hiện ở khu vực company-admin/packages để công ty đăng ký.
    public ResponseEntity<SuccessResponse<AdminPackageResponse>> createPackage(
            @Valid @RequestBody CreatePackageRequest request
    ) {
        requireAdmin();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SuccessResponse<>(HttpStatus.CREATED, "Tạo gói thành công", adminService.createPackage(request)));
    }

    @PatchMapping("/packages/{packageId}")
    // Cập nhật cấu hình gói dịch vụ hiện có:
    // tên gói, giá, thời hạn, mô tả và các ràng buộc hiển thị.
    public ResponseEntity<SuccessResponse<AdminPackageResponse>> updatePackage(
            @PathVariable Long packageId,
            @Valid @RequestBody UpdatePackageRequest request
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật gói thành công", adminService.updatePackage(packageId, request)));
    }

    @DeleteMapping("/packages/{packageId}")
    // Xóa một gói khỏi danh mục quản trị.
    // Thường được gọi sau khi admin xác nhận vì đây là thao tác ảnh hưởng dữ liệu kinh doanh.
    public ResponseEntity<SuccessResponse<Void>> deletePackage(@PathVariable Long packageId) {
        requireAdmin();
        adminService.deletePackage(packageId);
        return ResponseEntity.ok(new SuccessResponse<>("Xoá gói thành công", null));
    }

    @GetMapping("/jobs")
    // Lấy danh sách tin tuyển dụng cho màn /admin/jobs.
    // Hỗ trợ nhiều filter để admin duyệt tin theo công ty, trạng thái, ngành nghề, địa điểm.
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

    @GetMapping("/jobs/{jobId}")
    // Lấy chi tiết tin tuyển dụng để admin xem nội dung đầy đủ trước khi duyệt/từ chối.
    public ResponseEntity<SuccessResponse<AdminJobDetailResponse>> jobDetail(@PathVariable Long jobId) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy chi tiết tin tuyển dụng thành công", adminService.getJobDetail(jobId)));
    }

    @PatchMapping("/jobs/{jobId}/approve")
    // Duyệt tin tuyển dụng, chuyển trạng thái sang APPROVED.
    public ResponseEntity<SuccessResponse<AdminJobResponse>> approveJob(@PathVariable Long jobId) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Duyệt tin tuyển dụng thành công", adminService.approveJob(jobId)));
    }

    @PatchMapping("/jobs/{jobId}/reject")
    // Từ chối tin tuyển dụng và bắt buộc lưu lý do để hiển thị lại cho công ty.
    public ResponseEntity<SuccessResponse<AdminJobResponse>> rejectJob(
            @PathVariable Long jobId,
            @Valid @RequestBody ReviewJobRequest request
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Từ chối tin tuyển dụng thành công", adminService.rejectJob(jobId, request)));
    }

    @PatchMapping("/jobs/{jobId}/hide")
    // Ẩn tin đã tồn tại trên hệ thống mà không xóa cứng dữ liệu.
    public ResponseEntity<SuccessResponse<AdminJobResponse>> hideJob(@PathVariable Long jobId) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Ẩn tin tuyển dụng thành công", adminService.hideJob(jobId)));
    }

    @GetMapping("/candidate-proofs")
    // Lấy danh sách minh chứng học vấn/chứng chỉ của ứng viên để admin duyệt tính hợp lệ.
    public ResponseEntity<SuccessResponse<List<AdminCandidateProofResponse>>> candidateProofs(
            @RequestParam(required = false, defaultValue = "PENDING") String status
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách minh chứng ứng viên thành công", adminService.listCandidateProofs(status)));
    }

    @PatchMapping("/candidate-proofs/{type}/{proofId}/approve")
    // Duyệt minh chứng ứng viên, chuyển trạng thái sang APPROVED.
    public ResponseEntity<SuccessResponse<AdminCandidateProofResponse>> approveCandidateProof(
            @PathVariable String type,
            @PathVariable Long proofId
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Duyệt minh chứng ứng viên thành công", adminService.approveCandidateProof(type, proofId)));
    }

    @PatchMapping("/candidate-proofs/{type}/{proofId}/reject")
    // Từ chối minh chứng ứng viên, chuyển trạng thái sang REJECTED.
    public ResponseEntity<SuccessResponse<AdminCandidateProofResponse>> rejectCandidateProof(
            @PathVariable String type,
            @PathVariable Long proofId
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Từ chối minh chứng ứng viên thành công", adminService.rejectCandidateProof(type, proofId)));
    }

    @GetMapping("/reports")
    // Trả về dữ liệu báo cáo hệ thống theo khoảng thời gian (7d/30d/90d).
    // Route này cấp số liệu cho màn dashboard báo cáo admin.
    public ResponseEntity<SuccessResponse<AdminReportResponse>> reports(
            @RequestParam(required = false, defaultValue = "7d") String range
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy báo cáo hệ thống thành công", adminService.getReport(range)));
    }

    @GetMapping("/settings")
    // Lấy cấu hình quản trị hiện tại của hệ thống.
    // Frontend /admin/settings dùng route này để hiển thị giá trị mặc định khi mở màn cài đặt.
    // Về bản chất đây là "read model" cho admin settings, không thay đổi dữ liệu.
    public ResponseEntity<SuccessResponse<AdminSettingsResponse>> settings() {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy cài đặt admin thành công", adminService.getSettings()));
    }

    @PatchMapping("/settings")
    // Cập nhật các cài đặt quản trị đang expose trên UI admin.
    // Route này thường được gọi sau thao tác "Lưu thay đổi" ở màn settings.
    public ResponseEntity<SuccessResponse<AdminSettingsResponse>> updateSettings(
            @Valid @RequestBody UpdateAdminSettingsRequest request
    ) {
        requireAdmin();
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật cài đặt admin thành công", adminService.updateSettings(request)));
    }

    private void requireAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AppUserPrinciple principal)) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, "Chưa đăng nhập");
        }

        if (principal.getRole() != RoleName.ADMIN) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập");
        }
    }
}

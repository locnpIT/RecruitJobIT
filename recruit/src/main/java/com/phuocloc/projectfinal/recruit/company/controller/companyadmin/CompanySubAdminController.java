package com.phuocloc.projectfinal.recruit.company.controller.companyadmin;

import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.common.response.SuccessResponse;
import com.phuocloc.projectfinal.recruit.company.dto.request.CreateCompanyHrRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.CreateCompanyJobRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.CompanyProofUploadBatchRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.RegisterCompanyPackageRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.UpdateCompanyHrRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.UpdateCompanyInfoRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.UpdateCompanyJobRequest;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyAdminApplicationResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyAdminHrResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyAdminJobResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyAdminMeResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyAdminProofResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyJobMetadataResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyPackageOverviewResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyPackageRegistrationResponse;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyProofTypeResponse;
import com.phuocloc.projectfinal.recruit.company.dto.request.UpdateCompanyLogoRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.UpdateCompanyProofRequest;
import com.phuocloc.projectfinal.recruit.company.service.CompanyAdminService;
import com.phuocloc.projectfinal.recruit.company.service.CompanyHrManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/company-admin")
@RequiredArgsConstructor
/**
 * API khu vực quản trị công ty.
 *
 * <p>Controller này cấp dữ liệu cho toàn bộ màn /company-admin:
 * hồ sơ công ty, chi nhánh, minh chứng, gói, tin tuyển dụng, HR và đơn ứng tuyển.</p>
 */
public class CompanySubAdminController {

    private final CompanyAdminService companyAdminService;
    private final CompanyHrManagementService companyHrManagementService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('CANDIDATE')")
    // Lấy snapshot tổng hợp của khu vực company-admin:
    // user hiện tại, công ty, gói đang active, quyền đăng bài và chi nhánh.
    public ResponseEntity<SuccessResponse<CompanyAdminMeResponse>> getMe(
            @AuthenticationPrincipal AppUserPrinciple principal
    ) {
        CompanyAdminMeResponse data = companyAdminService.getMe(principal);
        return ResponseEntity.ok(new SuccessResponse<>("Lấy thông tin quản trị công ty thành công", data));
    }

    @GetMapping("/branches")
    @PreAuthorize("hasRole('CANDIDATE')")
    // Lấy danh sách chi nhánh của công ty hiện tại để render bảng hoặc dropdown chọn chi nhánh.
    public ResponseEntity<SuccessResponse<java.util.List<CompanyAdminMeResponse.ThongTinChiNhanh>>> getBranches(
            @AuthenticationPrincipal AppUserPrinciple principal
    ) {
        var data = companyAdminService.getBranches(principal);
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách chi nhánh thành công", data));
    }

    @PatchMapping("/company/logo")
    @PreAuthorize("hasRole('CANDIDATE')")
    // Cập nhật logo công ty sau khi frontend đã upload file lên Cloudinary.
    public ResponseEntity<SuccessResponse<CompanyAdminMeResponse.ThongTinCongTy>> updateCompanyLogo(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @org.springframework.web.bind.annotation.RequestBody UpdateCompanyLogoRequest request
    ) {
        var data = companyAdminService.updateLogo(principal, request);
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật logo công ty thành công", data));
    }

    @PostMapping("/company/proofs")
    @PreAuthorize("hasRole('CANDIDATE')")
    // Upload một minh chứng công ty.
    // Dùng cho trường hợp thêm từng tài liệu pháp lý riêng lẻ.
    public ResponseEntity<SuccessResponse<CompanyAdminProofResponse>> uploadCompanyProof(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody UpdateCompanyProofRequest request
    ) {
        var data = companyAdminService.uploadProofDocument(principal, request);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(new SuccessResponse<>(org.springframework.http.HttpStatus.CREATED, "Tải lên minh chứng công ty thành công", data));
    }

    @PostMapping("/company/proofs/batch")
    @PreAuthorize("hasRole('CANDIDATE')")
    // Upload nhiều minh chứng công ty trong một request.
    // Hữu ích khi form frontend gửi cả danh sách tài liệu cùng lúc.
    public ResponseEntity<SuccessResponse<java.util.List<CompanyAdminProofResponse>>> uploadCompanyProofBatch(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody CompanyProofUploadBatchRequest request
    ) {
        var data = companyAdminService.uploadProofDocuments(principal, request);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(new SuccessResponse<>(org.springframework.http.HttpStatus.CREATED, "Tải lên danh sách minh chứng công ty thành công", data));
    }

    @GetMapping("/company/proof-types")
    @PreAuthorize("hasRole('CANDIDATE')")
    // Trả về danh mục loại tài liệu công ty để frontend render select loại minh chứng.
    public ResponseEntity<SuccessResponse<java.util.List<CompanyProofTypeResponse>>> getCompanyProofTypes() {
        var data = companyAdminService.listProofTypes();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách loại tài liệu thành công", data));
    }

    @GetMapping("/packages")
    @PreAuthorize("hasRole('CANDIDATE')")
    // Lấy tổng quan gói dịch vụ của công ty:
    // danh sách gói mở bán, gói hiện tại và quyền đăng bài hiện hữu.
    public ResponseEntity<SuccessResponse<CompanyPackageOverviewResponse>> getPackages(
            @AuthenticationPrincipal AppUserPrinciple principal
    ) {
        var data = companyAdminService.listPackages(principal);
        return ResponseEntity.ok(new SuccessResponse<>("Lấy thông tin gói công ty thành công", data));
    }

    @PostMapping("/packages")
    @PreAuthorize("hasRole('CANDIDATE')")
    // Tạo một yêu cầu đăng ký gói mới cho công ty.
    // Route này là điểm đầu của luồng thanh toán SePay ở company-admin/packages.
    public ResponseEntity<SuccessResponse<CompanyPackageRegistrationResponse>> registerPackage(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody RegisterCompanyPackageRequest request
    ) {
        var data = companyAdminService.registerPackage(principal, request);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(new SuccessResponse<>(org.springframework.http.HttpStatus.CREATED, "Đăng ký gói công ty thành công", data));
    }

    @GetMapping("/jobs")
    @PreAuthorize("hasRole('CANDIDATE')")
    // Lấy danh sách tin tuyển dụng của một chi nhánh cụ thể.
    // Frontend bắt buộc truyền chiNhanhId để owner quản lý tin theo chi nhánh.
    public ResponseEntity<SuccessResponse<java.util.List<CompanyAdminJobResponse>>> getJobs(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @RequestParam Integer chiNhanhId
    ) {
        var data = companyAdminService.listJobs(principal, chiNhanhId);
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách tin tuyển dụng thành công", data));
    }

    @GetMapping("/jobs/metadata")
    @PreAuthorize("hasRole('CANDIDATE')")
    // Trả về metadata phục vụ form tạo/sửa job:
    // ngành nghề, loại hình làm việc, cấp độ kinh nghiệm...
    public ResponseEntity<SuccessResponse<CompanyJobMetadataResponse>> getJobMetadata() {
        var data = companyAdminService.getJobMetadata();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh mục tạo tin tuyển dụng thành công", data));
    }

    @PostMapping("/jobs")
    @PreAuthorize("hasRole('CANDIDATE')")
    // Tạo tin tuyển dụng mới từ phía công ty.
    // Tin tạo xong sẽ đi vào workflow duyệt của admin nếu business rule yêu cầu.
    public ResponseEntity<SuccessResponse<CompanyAdminJobResponse>> createJob(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody CreateCompanyJobRequest request
    ) {
        var data = companyAdminService.createJob(principal, request);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(new SuccessResponse<>(org.springframework.http.HttpStatus.CREATED, "Tạo tin tuyển dụng thành công", data));
    }

    @PatchMapping("/jobs/{jobId}")
    @PreAuthorize("hasRole('CANDIDATE')")
    // Cập nhật tin tuyển dụng hiện có của công ty.
    public ResponseEntity<SuccessResponse<CompanyAdminJobResponse>> updateJob(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long jobId,
            @jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody UpdateCompanyJobRequest request
    ) {
        var data = companyAdminService.updateJob(principal, jobId, request);
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật tin tuyển dụng thành công", data));
    }

    @DeleteMapping("/jobs/{jobId}")
    @PreAuthorize("hasRole('CANDIDATE')")
    // Xóa mềm một tin tuyển dụng thuộc công ty hiện tại.
    public ResponseEntity<SuccessResponse<Void>> deleteJob(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long jobId
    ) {
        companyAdminService.deleteJob(principal, jobId);
        return ResponseEntity.ok(new SuccessResponse<>("Xoá tin tuyển dụng thành công", null));
    }

    @GetMapping("/applications")
    @PreAuthorize("hasRole('CANDIDATE')")
    // Lấy danh sách đơn ứng tuyển theo chi nhánh để owner/HR theo dõi pipeline tuyển dụng.
    public ResponseEntity<SuccessResponse<java.util.List<CompanyAdminApplicationResponse>>> getApplications(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @RequestParam Integer chiNhanhId
    ) {
        var data = companyAdminService.listApplications(principal, chiNhanhId);
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách ứng viên thành công", data));
    }

    @PatchMapping("/company/info")
    @PreAuthorize("hasRole('CANDIDATE')")
    // Cập nhật thông tin mô tả công ty, website và dữ liệu hồ sơ hiển thị.
    public ResponseEntity<SuccessResponse<CompanyAdminMeResponse.ThongTinCongTy>> updateCompanyInfo(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody UpdateCompanyInfoRequest request
    ) {
        var data = companyAdminService.updateCompanyInfo(principal, request);
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật thông tin công ty thành công", data));
    }

    @PatchMapping("/company/resubmit")
    @PreAuthorize("hasRole('CANDIDATE')")
    // Gửi lại công ty vào hàng chờ duyệt sau khi owner đã chỉnh sửa hồ sơ bị từ chối.
    public ResponseEntity<SuccessResponse<CompanyAdminMeResponse.ThongTinCongTy>> resubmitCompany(
            @AuthenticationPrincipal AppUserPrinciple principal
    ) {
        var data = companyAdminService.resubmitCompany(principal);
        return ResponseEntity.ok(new SuccessResponse<>("Gửi duyệt lại công ty thành công", data));
    }

    @GetMapping("/hrs")
    @PreAuthorize("hasRole('CANDIDATE')")
    // Lấy danh sách tài khoản HR thuộc công ty để hiển thị ở màn /company-admin/hr.
    public ResponseEntity<SuccessResponse<java.util.List<CompanyAdminHrResponse>>> getHrs(
            @AuthenticationPrincipal AppUserPrinciple principal
    ) {
        var data = companyHrManagementService.getHrAccounts(principal.getUserId().intValue());
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách HR thành công", data));
    }

    @PostMapping("/hrs")
    @PreAuthorize("hasRole('CANDIDATE')")
    // Tạo tài khoản HR mới cho công ty.
    // Thường đi kèm gửi email thông tin truy cập cho nhân sự vừa tạo.
    public ResponseEntity<SuccessResponse<CompanyAdminHrResponse>> createHr(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody CreateCompanyHrRequest request
    ) {
        var data = companyHrManagementService.createHrAccount(principal.getUserId().intValue(), request);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(new SuccessResponse<>(org.springframework.http.HttpStatus.CREATED, "Tạo tài khoản HR thành công", data));
    }

    @PatchMapping("/hrs/{hrUserId}")
    @PreAuthorize("hasRole('CANDIDATE')")
    // Cập nhật thông tin một tài khoản HR đang thuộc công ty hiện tại.
    public ResponseEntity<SuccessResponse<CompanyAdminHrResponse>> updateHr(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long hrUserId,
            @jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody UpdateCompanyHrRequest request
    ) {
        var data = companyHrManagementService.updateHrAccount(principal.getUserId().intValue(), hrUserId, request);
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật tài khoản HR thành công", data));
    }

    @DeleteMapping("/hrs/{hrUserId}")
    @PreAuthorize("hasRole('CANDIDATE')")
    // Xóa/thu hồi một tài khoản HR khỏi công ty.
    public ResponseEntity<SuccessResponse<Void>> deleteHr(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @PathVariable Long hrUserId
    ) {
        companyHrManagementService.deleteHrAccount(principal.getUserId().intValue(), hrUserId);
        return ResponseEntity.ok(new SuccessResponse<>("Xoá tài khoản HR thành công", null));
    }
}

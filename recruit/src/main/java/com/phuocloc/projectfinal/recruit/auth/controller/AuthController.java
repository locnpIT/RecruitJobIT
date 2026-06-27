package com.phuocloc.projectfinal.recruit.auth.controller;

import com.phuocloc.projectfinal.recruit.auth.dto.request.ChangePasswordRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.request.CreateOwnerRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.request.ForgotPasswordRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.request.LoginRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.request.RegisterRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.request.ResetPasswordRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.request.VerifyEmailRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.request.UpdateAvatarRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.request.UpdateUserProfileRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.response.AuthResponse;
import com.phuocloc.projectfinal.recruit.auth.dto.response.CreateOwnerResponse;
import com.phuocloc.projectfinal.recruit.auth.dto.response.UserProfileResponse;
import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.auth.service.AuthService;
import com.phuocloc.projectfinal.recruit.auth.service.AuthUserProfileService;
import com.phuocloc.projectfinal.recruit.auth.service.OwnerRegistrationService;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyProofTypeResponse;
import com.phuocloc.projectfinal.recruit.common.response.SuccessResponse;
import com.phuocloc.projectfinal.recruit.infrastructure.cloudinary.CloudinaryStorageService;
import com.phuocloc.projectfinal.recruit.infrastructure.mail.PublicUrlProperties;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
/**
 * API xác thực và hồ sơ người dùng hiện tại.
 *
 * <p>Nhóm endpoint bao gồm đăng ký/đăng nhập, lấy thông tin user hiện tại
 * và cấp chữ ký upload Cloudinary cho frontend.</p>
 */
public class AuthController {

    private final AuthService authService;
    private final OwnerRegistrationService ownerRegistrationService;
    private final AuthUserProfileService authUserProfileService;
    private final CloudinaryStorageService cloudinaryStorageService;
    private final PublicUrlProperties publicUrlProperties;

    @GetMapping("/cloudinary-signature")
    // Cấp chữ ký upload cho frontend.
    // Frontend dùng route này trước khi upload avatar/minh chứng lên Cloudinary để tránh lộ secret.
    public ResponseEntity<SuccessResponse<Map<String, Object>>> getCloudinarySignature(
            @RequestParam(name = "purpose", required = false, defaultValue = "proof") String purpose
    ) {
        Map<String, Object> signatureData = cloudinaryStorageService.generateSignature(purpose);
        return ResponseEntity.ok(new SuccessResponse<>("Lấy chữ ký thành công", signatureData));
    }

    @PostMapping("/register")
    // Đăng ký tài khoản candidate mới.
    public ResponseEntity<SuccessResponse<AuthResponse>> registerCandidate(
            @Valid @RequestBody RegisterRequest request
    ) {
        AuthResponse data = authService.registerCandidate(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SuccessResponse<>(HttpStatus.CREATED, "Đăng ký thành công", data));
    }

    @PostMapping("/register-owner")
    // Đăng ký tài khoản owner công ty.
    public ResponseEntity<SuccessResponse<CreateOwnerResponse>> registerOwner(
            @Valid @RequestBody CreateOwnerRequest request
    ) {
        CreateOwnerResponse data = ownerRegistrationService.registerOwner(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SuccessResponse<>(HttpStatus.CREATED, "Đăng ký chủ công ty thành công", data));
    }

    @GetMapping("/proof-types")
    public ResponseEntity<SuccessResponse<List<CompanyProofTypeResponse>>> getOwnerProofTypes() {
        List<CompanyProofTypeResponse> data = ownerRegistrationService.listOwnerProofTypes();
        return ResponseEntity.ok(new SuccessResponse<>("Lấy danh sách loại tài liệu thành công", data));
    }

    @PostMapping("/verify-email/confirm")
    public ResponseEntity<SuccessResponse<String>> confirmEmail(@Valid @RequestBody VerifyEmailRequest request) {
        authService.verifyEmailByCode(request);
        return ResponseEntity.ok(new SuccessResponse<>("Xác nhận email thành công", "OK"));
    }

    @PostMapping("/verify-email/resend")
    public ResponseEntity<SuccessResponse<String>> resendVerifyEmail(@RequestParam("email") String email) {
        authService.resendEmailVerification(email);
        return ResponseEntity.ok(new SuccessResponse<>("Đã gửi lại mã xác nhận", "OK"));
    }

    @PostMapping("/login")
    public ResponseEntity<SuccessResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse data = authService.login(request);
        return ResponseEntity.ok(new SuccessResponse<>("Đăng nhập thành công", data));
    }

    @PostMapping("/forgot-password")
    // Gửi OTP 6 số về email để bắt đầu luồng khôi phục mật khẩu.
    public ResponseEntity<SuccessResponse<String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(new SuccessResponse<>("Mã xác nhận đã được gửi về email của bạn", "OK"));
    }

    @PostMapping("/reset-password")
    // Đặt lại mật khẩu bằng OTP đã gửi qua email.
    public ResponseEntity<SuccessResponse<String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(new SuccessResponse<>("Đặt lại mật khẩu thành công", "OK"));
    }

    @PostMapping("/me/change-password")
    // Đổi mật khẩu khi đã đăng nhập — yêu cầu mật khẩu hiện tại để xác minh danh tính.
    public ResponseEntity<SuccessResponse<String>> changePassword(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        authService.changePassword(principal.getUserId().intValue(), request);
        return ResponseEntity.ok(new SuccessResponse<>("Đổi mật khẩu thành công", "OK"));
    }

    @GetMapping("/me")
    public ResponseEntity<SuccessResponse<UserProfileResponse>> getMe(
            @AuthenticationPrincipal AppUserPrinciple principal
    ) {
        UserProfileResponse data = authUserProfileService.getCurrentUserProfile(principal.getUserId());
        return ResponseEntity.ok(new SuccessResponse<>("Lấy hồ sơ người dùng thành công", data));
    }

    @PatchMapping("/me/avatar")
    public ResponseEntity<SuccessResponse<UserProfileResponse>> updateAvatar(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @Valid @RequestBody UpdateAvatarRequest request
    ) {
        UserProfileResponse data = authUserProfileService.updateAvatar(principal.getUserId(), request);
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật ảnh đại diện thành công", data));
    }

    @PatchMapping("/me")
    public ResponseEntity<SuccessResponse<UserProfileResponse>> updateMe(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @RequestBody UpdateUserProfileRequest request
    ) {
        UserProfileResponse data = authUserProfileService.updateCurrentUserProfile(principal.getUserId(), request);
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật hồ sơ người dùng thành công", data));
    }

}

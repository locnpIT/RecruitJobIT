package com.phuocloc.projectfinal.recruit.auth.controller;

import com.phuocloc.projectfinal.recruit.auth.dto.request.CreateOwnerRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.request.LoginRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.request.RegisterRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.request.UpdateAvatarRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.response.AuthResponse;
import com.phuocloc.projectfinal.recruit.auth.dto.response.CreateOwnerResponse;
import com.phuocloc.projectfinal.recruit.auth.dto.response.UserProfileResponse;
import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.auth.service.AuthService;
import com.phuocloc.projectfinal.recruit.common.response.SuccessResponse;
import com.phuocloc.projectfinal.recruit.infrastructure.cloudinary.CloudinaryStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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
    private final CloudinaryStorageService cloudinaryStorageService;

    @GetMapping("/cloudinary-signature")
    // Cấp chữ ký upload cho frontend.
    // Frontend dùng route này trước khi upload avatar/minh chứng lên Cloudinary để tránh lộ secret.
    public ResponseEntity<SuccessResponse<Map<String, Object>>> getCloudinarySignature(
            @RequestParam(name = "purpose", required = false, defaultValue = "proof") String purpose
    ) {
        // Frontend dùng chữ ký này để upload trực tiếp lên Cloudinary.
        Map<String, Object> signatureData = cloudinaryStorageService.generateSignature(purpose);
        return ResponseEntity.ok(new SuccessResponse<>("Lấy chữ ký thành công", signatureData));
    }

    @PostMapping("/register")
    // Đăng ký tài khoản candidate mới.
    // Sau khi thành công backend đồng thời khởi tạo dữ liệu user/hồ sơ tối thiểu cho ứng viên.
    public ResponseEntity<SuccessResponse<AuthResponse>> registerCandidate(
            @Valid @RequestBody RegisterRequest request
    ) {
        AuthResponse data = authService.registerCandidate(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SuccessResponse<>(HttpStatus.CREATED, "Đăng ký thành công", data));
    }

    @PostMapping("/register-owner")
    // Đăng ký tài khoản owner công ty.
    // Route này dùng ở form đăng ký doanh nghiệp và đi kèm dữ liệu công ty/chi nhánh/minh chứng.
    public ResponseEntity<SuccessResponse<CreateOwnerResponse>> registerOwner(
            @Valid @RequestBody CreateOwnerRequest request
    ) {
        CreateOwnerResponse data = authService.registerOwner(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SuccessResponse<>(HttpStatus.CREATED, "Đăng ký chủ công ty thành công", data));
    }

    @PostMapping("/login")
    // Xác thực email + mật khẩu và trả về access token cùng thông tin user hiện tại.
    public ResponseEntity<SuccessResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse data = authService.login(request);
        return ResponseEntity.ok(new SuccessResponse<>("Đăng nhập thành công", data));
    }

    @GetMapping("/me")
    // Lấy thông tin user hiện tại theo JWT đang đăng nhập.
    // Frontend dùng route này để hydrate header/profile sau khi có token.
    public ResponseEntity<SuccessResponse<UserProfileResponse>> getMe(
            @AuthenticationPrincipal AppUserPrinciple principal
    ) {
        UserProfileResponse data = authService.getCurrentUserProfile(principal.getUserId());
        return ResponseEntity.ok(new SuccessResponse<>("Lấy hồ sơ người dùng thành công", data));
    }

    @PatchMapping("/me/avatar")
    // Cập nhật URL ảnh đại diện của user hiện tại sau khi frontend upload ảnh lên Cloudinary.
    public ResponseEntity<SuccessResponse<UserProfileResponse>> updateAvatar(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @Valid @RequestBody UpdateAvatarRequest request
    ) {
        UserProfileResponse data = authService.updateAvatar(principal.getUserId(), request);
        return ResponseEntity.ok(new SuccessResponse<>("Cập nhật ảnh đại diện thành công", data));
    }
}

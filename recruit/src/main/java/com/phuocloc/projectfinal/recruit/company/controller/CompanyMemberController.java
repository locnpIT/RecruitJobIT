package com.phuocloc.projectfinal.recruit.company.controller;

import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.auth.service.AuthService;
import com.phuocloc.projectfinal.recruit.company.dto.request.CreateEmployerRequest;
import com.phuocloc.projectfinal.recruit.company.dto.response.CreateEmployerResponse;
import com.phuocloc.projectfinal.recruit.common.response.SuccessResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/company")
@RequiredArgsConstructor
/**
 * API thao tác thành viên công ty từ phía owner.
 *
 * <p>Hiện controller này phục vụ luồng tạo nhân sự/employer mới trong công ty.</p>
 */
public class CompanyMemberController {

    private final AuthService authService;

    @PostMapping("/employers")
    // Tạo một tài khoản nhân sự mới thuộc công ty của owner đang đăng nhập.
    // Route này phục vụ các luồng thêm employer/HR từ phía quản trị công ty.
    public ResponseEntity<SuccessResponse<CreateEmployerResponse>> createEmployer(
            @AuthenticationPrincipal AppUserPrinciple principal,
            @Valid @RequestBody CreateEmployerRequest request
    ) {
        CreateEmployerResponse data = authService.createEmployerByOwner(principal.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SuccessResponse<>(HttpStatus.CREATED, "Tạo nhân sự công ty thành công", data));
    }
}

package com.phuocloc.projectfinal.recruit.auth.service;

import com.phuocloc.projectfinal.recruit.auth.dto.request.LoginRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.request.RegisterRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.response.AuthResponse;
import com.phuocloc.projectfinal.recruit.auth.enums.RoleName;
import com.phuocloc.projectfinal.recruit.auth.repository.RolesRepository;
import com.phuocloc.projectfinal.recruit.auth.repository.UsersRepository;
import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.VaiTroHeThong;
import com.phuocloc.projectfinal.recruit.common.util.ServiceUtils;
import com.phuocloc.projectfinal.recruit.infrastructure.mail.HrCredentialMailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
/**
 * Nghiệp vụ xác thực cốt lõi: đăng ký candidate và đăng nhập lấy token.
 */
public class AuthService {

    private final UsersRepository usersRepository;
    private final RolesRepository rolesRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final HrCredentialMailService mailService;

    @Transactional
    public AuthResponse registerCandidate(RegisterRequest request) {
        // Chuẩn hóa email trước khi lưu để tránh trùng khác biệt chữ hoa/thường.
        String normalizedEmail = normalizeEmail(request.getEmail());
        ensureEmailNotExists(normalizedEmail);

        VaiTroHeThong candidateRole = requireRole(RoleName.CANDIDATE);

        NguoiDung user = new NguoiDung();
        user.setEmail(normalizedEmail);
        user.setMatKhauBam(passwordEncoder.encode(request.getMatKhau()));
        user.setTen(request.getTen().trim());
        user.setHo(request.getHo().trim());
        user.setSoDienThoai(trimToNull(request.getSoDienThoai()));
        // Candidate phải bấm link xác nhận email trước khi đăng nhập.
        user.setDangHoatDong(false);
        user.setVaiTroHeThong(candidateRole);
        user = usersRepository.save(user);

        mailService.sendCandidateEmailVerification(
                user.getId() == null ? null : user.getId().longValue(),
                user.getEmail(),
                user.getTen(),
                user.getHo()
        );

        String accessToken = jwtService.generateAccessToken(user);
        return buildAuthResponse(user, accessToken);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        NguoiDung user = usersRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sai email hoặc mật khẩu"));

        if (!Boolean.TRUE.equals(user.getDangHoatDong())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản chưa được kích hoạt");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.getMatKhau())
            );
        } catch (BadCredentialsException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sai email hoặc mật khẩu");
        }

        String accessToken = jwtService.generateAccessToken(user);
        return buildAuthResponse(user, accessToken);
    }

    @Transactional
    public void verifyEmailByUserId(Long userId) {
        Integer safeUserId = toIntId(userId, "userId");
        NguoiDung user = usersRepository.findById(safeUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản cần xác nhận"));
        user.setDangHoatDong(true);
        usersRepository.save(user);
    }

    private VaiTroHeThong requireRole(RoleName roleName) {
        return rolesRepository.findByTen(roleName.name())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Thiếu role trong DB: " + roleName
                ));
    }

    private void ensureEmailNotExists(String email) {
        if (usersRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email đã tồn tại");
        }
    }

    private String normalizeEmail(String email) {
        return ServiceUtils.normalizeEmail(email);
    }

    private String trimToNull(String value) {
        return ServiceUtils.trimToNull(value);
    }

    private Integer toIntId(Long value, String fieldName) {
        if (value == null || value <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " không hợp lệ");
        }
        try {
            return Math.toIntExact(value);
        } catch (ArithmeticException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " vượt quá giới hạn", ex);
        }
    }

    private AuthResponse buildAuthResponse(NguoiDung nguoiDung, String accessToken) {
        AuthResponse.ThongTinNguoiDung thongTinNguoiDung = AuthResponse.ThongTinNguoiDung.builder()
                .id(nguoiDung.getId() == null ? null : nguoiDung.getId().longValue())
                .email(nguoiDung.getEmail())
                .ten(nguoiDung.getTen())
                .ho(nguoiDung.getHo())
                .soDienThoai(nguoiDung.getSoDienThoai())
                .vaiTro(nguoiDung.getVaiTroHeThong() == null ? null : nguoiDung.getVaiTroHeThong().getTen())
                .dangHoatDong(nguoiDung.getDangHoatDong())
                .anhDaiDienUrl(nguoiDung.getAnhDaiDienUrl())
                .build();

        AuthResponse.ThongTinPhienDangNhap phienDangNhap = AuthResponse.ThongTinPhienDangNhap.builder()
                .accessToken(accessToken)
                .thoiHanTokenGiay(jwtService.getAccessTokenExpiresIn())
                .build();

        AuthResponse response = new AuthResponse();
        response.setNguoiDung(thongTinNguoiDung);
        response.setPhienDangNhap(phienDangNhap);
        return response;
    }
}

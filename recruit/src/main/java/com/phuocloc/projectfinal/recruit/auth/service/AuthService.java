package com.phuocloc.projectfinal.recruit.auth.service;

import com.phuocloc.projectfinal.recruit.auth.dto.request.LoginRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.request.RegisterRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.request.VerifyEmailRequest;
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
import org.springframework.web.server.ResponseStatusException;
import org.springframework.util.StringUtils;
import java.security.SecureRandom;

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
        String normalizedEmail = ServiceUtils.normalizeEmail(request.getEmail());
        ensureEmailNotExists(normalizedEmail);

        VaiTroHeThong userRole = requireRole(RoleName.USER);

        NguoiDung user = new NguoiDung();
        user.setEmail(normalizedEmail);
        user.setMatKhauBam(passwordEncoder.encode(request.getMatKhau()));
        user.setTen(request.getTen().trim());
        user.setHo(request.getHo().trim());
        user.setSoDienThoai(ServiceUtils.trimToNull(request.getSoDienThoai()));
        // Candidate phải bấm link xác nhận email trước khi đăng nhập.
        user.setDangHoatDong(false);
        user.setVaiTroHeThong(userRole);
        user.setMaXacNhanEmail(generateEmailVerificationCode());
        user = usersRepository.save(user);

        mailService.sendCandidateEmailVerification(
                user.getEmail(),
                user.getTen(),
                user.getHo(),
                user.getMaXacNhanEmail()
        );

        return buildAuthResponse(user, null);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = ServiceUtils.normalizeEmail(request.getEmail());

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
    public void verifyEmailByCode(VerifyEmailRequest request) {
        String normalizedEmail = ServiceUtils.normalizeEmail(request.getEmail());
        NguoiDung user = usersRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản cần xác nhận"));

        if (Boolean.TRUE.equals(user.getDangHoatDong())) {
            return;
        }

        String currentCode = user.getMaXacNhanEmail();
        if (!StringUtils.hasText(currentCode) || !currentCode.equals(request.getMaXacNhan())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã xác nhận không đúng");
        }

        user.setDangHoatDong(true);
        user.setMaXacNhanEmail(null);
        usersRepository.save(user);
    }

    @Transactional
    public void resendEmailVerification(String email) {
        String normalizedEmail = ServiceUtils.normalizeEmail(email);
        NguoiDung user = usersRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản cần xác nhận"));

        if (Boolean.TRUE.equals(user.getDangHoatDong())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tài khoản đã được kích hoạt");
        }

        user.setMaXacNhanEmail(generateEmailVerificationCode());
        usersRepository.save(user);
        mailService.sendCandidateEmailVerification(
                user.getEmail(),
                user.getTen(),
                user.getHo(),
                user.getMaXacNhanEmail()
        );
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

    private AuthResponse buildAuthResponse(NguoiDung nguoiDung, String accessToken) {
        AuthResponse.ThongTinNguoiDung thongTinNguoiDung = AuthResponse.ThongTinNguoiDung.builder()
                .id(ServiceUtils.toLong(nguoiDung.getId()))
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

    private String generateEmailVerificationCode() {
        return String.format("%06d", SecureRandomHolder.INSTANCE.nextInt(1_000_000));
    }

    private static final class SecureRandomHolder {
        private static final SecureRandom INSTANCE = new SecureRandom();
    }
}

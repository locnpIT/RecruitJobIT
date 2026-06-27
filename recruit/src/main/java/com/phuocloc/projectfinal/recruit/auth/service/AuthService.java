package com.phuocloc.projectfinal.recruit.auth.service;

import com.phuocloc.projectfinal.recruit.auth.dto.request.ChangePasswordRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.request.ForgotPasswordRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.request.LoginRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.request.RegisterRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.request.ResetPasswordRequest;
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
        user.setMaXacNhanEmail(generateOtpCode());
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

        if (!passwordEncoder.matches(request.getMatKhau(), user.getMatKhauBam())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sai email hoặc mật khẩu");
        }

        if (!Boolean.TRUE.equals(user.getDangHoatDong())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản chưa được kích hoạt");
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

        user.setMaXacNhanEmail(generateOtpCode());
        usersRepository.save(user);
        mailService.sendCandidateEmailVerification(
                user.getEmail(),
                user.getTen(),
                user.getHo(),
                user.getMaXacNhanEmail()
        );
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String normalizedEmail = ServiceUtils.normalizeEmail(request.getEmail());
        NguoiDung user = usersRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Email không tồn tại trong hệ thống"));

        if (!Boolean.TRUE.equals(user.getDangHoatDong())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản chưa được kích hoạt, không thể khôi phục mật khẩu");
        }

        user.setMaXacNhanEmail(generateOtpCode());
        usersRepository.save(user);

        mailService.sendForgotPasswordCode(
                user.getEmail(),
                user.getTen(),
                user.getHo(),
                user.getMaXacNhanEmail()
        );
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String normalizedEmail = ServiceUtils.normalizeEmail(request.getEmail());
        NguoiDung user = usersRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Email không tồn tại trong hệ thống"));

        String currentCode = user.getMaXacNhanEmail();
        if (!StringUtils.hasText(currentCode) || !currentCode.equals(request.getMaXacNhan())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã xác nhận không đúng hoặc đã hết hạn");
        }

        user.setMatKhauBam(passwordEncoder.encode(request.getMatKhauMoi()));
        user.setMaXacNhanEmail(null);
        usersRepository.save(user);
    }

    @Transactional
    public void changePassword(Integer userId, ChangePasswordRequest request) {
        NguoiDung user = usersRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản"));

        if (!passwordEncoder.matches(request.getMatKhauHienTai(), user.getMatKhauBam())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu hiện tại không đúng");
        }

        user.setMatKhauBam(passwordEncoder.encode(request.getMatKhauMoi()));
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

    private String generateOtpCode() {
        return String.format("%06d", SecureRandomHolder.INSTANCE.nextInt(1_000_000));
    }

    private static final class SecureRandomHolder {
        private static final SecureRandom INSTANCE = new SecureRandom();
    }
}

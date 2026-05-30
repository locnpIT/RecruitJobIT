package com.phuocloc.projectfinal.recruit.auth.service;

import com.phuocloc.projectfinal.recruit.auth.dto.request.LoginRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.request.RegisterRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.response.AuthResponse;
import com.phuocloc.projectfinal.recruit.auth.enums.RoleName;
import com.phuocloc.projectfinal.recruit.auth.repository.RolesRepository;
import com.phuocloc.projectfinal.recruit.auth.repository.UsersRepository;
import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.VaiTroHeThong;
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
        user.setDangHoatDong(true);
        user.setVaiTroHeThong(candidateRole);
        user = usersRepository.save(user);

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
        if (!StringUtils.hasText(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email không được để trống");
        }
        return email.trim().toLowerCase();
    }

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
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

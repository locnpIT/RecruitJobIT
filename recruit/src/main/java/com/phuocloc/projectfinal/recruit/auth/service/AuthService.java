package com.phuocloc.projectfinal.recruit.auth.service;

import com.phuocloc.projectfinal.recruit.auth.dto.request.CreateOwnerRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.request.LoginRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.request.RegisterRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.response.AuthResponse;
import com.phuocloc.projectfinal.recruit.auth.dto.response.CreateOwnerResponse;
import com.phuocloc.projectfinal.recruit.auth.enums.RegisterRole;
import com.phuocloc.projectfinal.recruit.auth.enums.RoleName;
import com.phuocloc.projectfinal.recruit.auth.repository.RolesRepository;
import com.phuocloc.projectfinal.recruit.auth.repository.UsersRepository;
import com.phuocloc.projectfinal.recruit.candidate.repository.CandidateProfileRepository;
import com.phuocloc.projectfinal.recruit.company.dto.request.CreateEmployerRequest;
import com.phuocloc.projectfinal.recruit.company.dto.response.CreateEmployerResponse;
import com.phuocloc.projectfinal.recruit.company.enums.CompanyProofDocumentStatus;
import com.phuocloc.projectfinal.recruit.company.enums.CompanyProofDocumentType;
import com.phuocloc.projectfinal.recruit.company.enums.CompanyStatus;
import com.phuocloc.projectfinal.recruit.company.enums.EmployerCompanyRole;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyBranchRepository;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyProofDocumentRepository;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyRepository;
import com.phuocloc.projectfinal.recruit.company.repository.EmployerProfileRepository;
import com.phuocloc.projectfinal.recruit.company.repository.LoaiTaiLieuRepository;
import com.phuocloc.projectfinal.recruit.company.repository.VaiTroCongTyRepository;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ChiNhanhCongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.CongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.LoaiTaiLieu;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.TepMinhChungCongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ThanhVienCongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.VaiTroCongTy;
import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.VaiTroHeThong;
import com.phuocloc.projectfinal.recruit.domain.ungvien.entity.HoSoUngVien;
import com.phuocloc.projectfinal.recruit.infrastructure.cloudinary.CloudinaryStorageService;
import com.phuocloc.projectfinal.recruit.infrastructure.mail.HrCredentialMailService;
import java.net.URI;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ThreadLocalRandom;
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
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String TEMP_PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%";
    private static final int HR_TEMP_PASSWORD_LENGTH = 12;

    private final UsersRepository usersRepository;
    private final RolesRepository rolesRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final CompanyRepository companyRepository;
    private final CompanyBranchRepository companyBranchRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final CompanyProofDocumentRepository companyProofDocumentRepository;
    private final VaiTroCongTyRepository vaiTroCongTyRepository;
    private final LoaiTaiLieuRepository loaiTaiLieuRepository;

    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final CloudinaryStorageService cloudinaryStorageService;
    private final HrCredentialMailService hrCredentialMailService;

    @Transactional
    public AuthResponse registerCandidate(RegisterRequest request) {
        if (request.getRole() != RegisterRole.CANDIDATE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Endpoint này chỉ đăng ký CANDIDATE");
        }

        String normalizedEmail = normalizeEmail(request.getEmail());
        ensureEmailNotExists(normalizedEmail);

        VaiTroHeThong candidateRole = requireRole(RoleName.CANDIDATE);

        NguoiDung user = new NguoiDung();
        user.setEmail(normalizedEmail);
        user.setMatKhauBam(passwordEncoder.encode(request.getPassword()));
        user.setTen(request.getFirstName().trim());
        user.setHo(request.getLastName().trim());
        user.setSoDienThoai(trimToNull(request.getPhoneNumber()));
        user.setDangHoatDong(true);
        user.setVaiTroHeThong(candidateRole);
        user = usersRepository.save(user);

        HoSoUngVien hoSoUngVien = new HoSoUngVien();
        hoSoUngVien.setNguoiDung(user);
        candidateProfileRepository.save(hoSoUngVien);

        String accessToken = jwtService.generateAccessToken(user);
        return toAuthResponse(user, accessToken);
    }

    @Transactional
    public CreateOwnerResponse registerOwner(CreateOwnerRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        ensureEmailNotExists(normalizedEmail);

        VaiTroHeThong ownerRole = requireRole(RoleName.OWNER);
        String proofUrl = resolveProofUrl(request);

        NguoiDung owner = new NguoiDung();
        owner.setEmail(normalizedEmail);
        owner.setMatKhauBam(passwordEncoder.encode(request.getPassword()));
        owner.setTen(request.getFirstName().trim());
        owner.setHo(request.getLastName().trim());
        owner.setSoDienThoai(trimToNull(request.getPhoneNumber()));
        owner.setDangHoatDong(true);
        owner.setVaiTroHeThong(ownerRole);
        owner = usersRepository.save(owner);

        CongTy congTy = new CongTy();
        congTy.setTen(buildDefaultCompanyName(owner));
        congTy.setMaSoThue(generateTempTaxCode());
        congTy.setTrangThai(CompanyStatus.PENDING.name());
        congTy.setChuCongTy(owner);
        congTy = companyRepository.save(congTy);

        ChiNhanhCongTy chiNhanhChinh = new ChiNhanhCongTy();
        chiNhanhChinh.setCongTy(congTy);
        chiNhanhChinh.setTen(congTy.getTen() + " - Tru so chinh");
        chiNhanhChinh.setLaTruSoChinh(true);
        chiNhanhChinh = companyBranchRepository.save(chiNhanhChinh);

        VaiTroCongTy vaiTroOwner = requireCompanyRole(EmployerCompanyRole.OWNER);

        ThanhVienCongTy ownerProfile = new ThanhVienCongTy();
        ownerProfile.setNguoiDung(owner);
        ownerProfile.setChiNhanh(chiNhanhChinh);
        ownerProfile.setVaiTroCongTy(vaiTroOwner);
        ownerProfile.setTrangThai("ACTIVE");
        employerProfileRepository.save(ownerProfile);

        LoaiTaiLieu loaiTaiLieu = resolveOrCreateLoaiTaiLieu(CompanyProofDocumentType.OWNER_ID_CARD.name());

        TepMinhChungCongTy proofDocument = new TepMinhChungCongTy();
        proofDocument.setCongTy(congTy);
        proofDocument.setLoaiTaiLieu(loaiTaiLieu);
        proofDocument.setDuongDanTep(proofUrl);
        proofDocument.setTenTep(resolveProofFileName(proofUrl, request.getProofFile()));
        proofDocument.setTrangThai(CompanyProofDocumentStatus.PENDING.name());
        companyProofDocumentRepository.save(proofDocument);

        String accessToken = jwtService.generateAccessToken(owner);

        return CreateOwnerResponse.builder()
                .owner(CreateOwnerResponse.OwnerInfo.builder()
                        .id(owner.getId().longValue())
                        .email(owner.getEmail())
                        .firstName(owner.getTen())
                        .lastName(owner.getHo())
                        .proofUrl(proofUrl)
                        .role(owner.getVaiTroHeThong().getTen())
                        .isActive(owner.getDangHoatDong())
                        .build())
                .token(CreateOwnerResponse.TokenData.builder()
                        .accessToken(accessToken)
                        .accessTokenExpiresIn(jwtService.getAccessTokenExpiresIn())
                        .build())
                .build();
    }

    @Transactional
    public CreateEmployerResponse createEmployerByOwner(Long ownerUserId, CreateEmployerRequest request) {
        ThanhVienCongTy ownerProfile = requireOwnerProfile(ownerUserId);

        String normalizedEmail = normalizeEmail(request.getEmail());
        ensureEmailNotExists(normalizedEmail);

        CongTy ownerCompany = requireOwnerCompany(ownerProfile);
        Integer branchId = toIntId(request.getBranchId(), "branchId");

        ChiNhanhCongTy branch = companyBranchRepository.findById(branchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy chi nhánh"));

        if (!branch.getCongTy().getId().equals(ownerCompany.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chi nhánh không thuộc công ty của OWNER");
        }

        VaiTroHeThong hrRole = requireRole(RoleName.HR);
        VaiTroCongTy vaiTroHr = requireCompanyRole(EmployerCompanyRole.HR);

        String temporaryPassword = generateTemporaryPassword(HR_TEMP_PASSWORD_LENGTH);

        NguoiDung hrUser = new NguoiDung();
        hrUser.setEmail(normalizedEmail);
        hrUser.setMatKhauBam(passwordEncoder.encode(temporaryPassword));
        hrUser.setTen(request.getFirstName().trim());
        hrUser.setHo(request.getLastName().trim());
        hrUser.setSoDienThoai(trimToNull(request.getPhoneNumber()));
        hrUser.setDangHoatDong(true);
        hrUser.setVaiTroHeThong(hrRole);
        hrUser = usersRepository.save(hrUser);

        ThanhVienCongTy hrProfile = new ThanhVienCongTy();
        hrProfile.setNguoiDung(hrUser);
        hrProfile.setChiNhanh(branch);
        hrProfile.setVaiTroCongTy(vaiTroHr);
        hrProfile.setTrangThai("ACTIVE");
        hrProfile = employerProfileRepository.save(hrProfile);

        hrCredentialMailService.sendInitialPassword(
                hrUser.getEmail(),
                hrUser.getTen(),
                hrUser.getHo(),
                ownerCompany.getTen(),
                temporaryPassword
        );

        return CreateEmployerResponse.builder()
                .employerProfileId(hrUser.getId().longValue())
                .userId(hrUser.getId().longValue())
                .email(hrUser.getEmail())
                .firstName(hrUser.getTen())
                .lastName(hrUser.getHo())
                .phoneNumber(hrUser.getSoDienThoai())
                .companyId(ownerCompany.getId().longValue())
                .branchId(branch.getId().longValue())
                .companyRole(hrProfile.getVaiTroCongTy().getTen())
                .isActive(hrUser.getDangHoatDong())
                .build();
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
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
            );
        } catch (BadCredentialsException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sai email hoặc mật khẩu");
        }

        String accessToken = jwtService.generateAccessToken(user);
        return toAuthResponse(user, accessToken);
    }

    private ThanhVienCongTy requireOwnerProfile(Long ownerUserId) {
        if (ownerUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Thiếu thông tin người dùng đăng nhập");
        }

        Integer ownerId = toIntId(ownerUserId, "ownerUserId");

        ThanhVienCongTy ownerProfile = employerProfileRepository
                .findFirstByNguoiDung_IdAndVaiTroCongTy_TenIgnoreCase(ownerId, EmployerCompanyRole.OWNER.name())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Không tìm thấy hồ sơ OWNER"));

        if (!Boolean.TRUE.equals(ownerProfile.getNguoiDung().getDangHoatDong())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Hồ sơ OWNER đang bị vô hiệu hóa");
        }

        return ownerProfile;
    }

    private CongTy requireOwnerCompany(ThanhVienCongTy ownerProfile) {
        if (ownerProfile.getChiNhanh() == null || ownerProfile.getChiNhanh().getCongTy() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Hồ sơ OWNER chưa được gắn chi nhánh/công ty hợp lệ"
            );
        }
        return ownerProfile.getChiNhanh().getCongTy();
    }

    private VaiTroHeThong requireRole(RoleName roleName) {
        return rolesRepository.findByTen(roleName.name())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Thiếu role trong DB: " + roleName
                ));
    }

    private VaiTroCongTy requireCompanyRole(EmployerCompanyRole companyRole) {
        return vaiTroCongTyRepository.findByTenIgnoreCase(companyRole.name())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Thiếu vai trò công ty trong DB: " + companyRole
                ));
    }

    private LoaiTaiLieu resolveOrCreateLoaiTaiLieu(String tenLoaiTaiLieu) {
        return loaiTaiLieuRepository.findByTenIgnoreCase(tenLoaiTaiLieu)
                .orElseGet(() -> {
                    LoaiTaiLieu loaiTaiLieu = new LoaiTaiLieu();
                    loaiTaiLieu.setTen(tenLoaiTaiLieu);
                    loaiTaiLieu.setMoTa("Tự tạo từ luồng đăng ký OWNER");
                    return loaiTaiLieuRepository.save(loaiTaiLieu);
                });
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

    private String resolveProofUrl(CreateOwnerRequest request) {
        if (StringUtils.hasText(request.getProofUrl())) {
            return request.getProofUrl().trim();
        }

        MultipartFile proofFile = request.getProofFile();
        if (proofFile == null || proofFile.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần proofFile hoặc proofUrl");
        }

        return cloudinaryStorageService.uploadProof(proofFile);
    }

    private String buildDefaultCompanyName(NguoiDung owner) {
        return "Cong ty cua " + owner.getHo() + " " + owner.getTen();
    }

    private String generateTempTaxCode() {
        String tempTaxCode;
        do {
            tempTaxCode = "TEMP-"
                    + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                    + "-"
                    + ThreadLocalRandom.current().nextInt(1000, 9999);
        } while (companyRepository.existsByMaSoThue(tempTaxCode));

        return tempTaxCode;
    }

    private String resolveProofFileName(String proofUrl, MultipartFile proofFile) {
        if (proofFile != null && StringUtils.hasText(proofFile.getOriginalFilename())) {
            return proofFile.getOriginalFilename().trim();
        }

        try {
            String path = URI.create(proofUrl).getPath();
            if (!StringUtils.hasText(path)) {
                return "owner-proof";
            }
            int slashIndex = path.lastIndexOf('/');
            return slashIndex >= 0 ? path.substring(slashIndex + 1) : path;
        } catch (Exception ex) {
            return "owner-proof";
        }
    }

    private String generateTemporaryPassword(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int index = SECURE_RANDOM.nextInt(TEMP_PASSWORD_ALPHABET.length());
            sb.append(TEMP_PASSWORD_ALPHABET.charAt(index));
        }
        return sb.toString();
    }

    private Integer toIntId(Long id, String fieldName) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " không được để trống");
        }
        if (id > Integer.MAX_VALUE || id < Integer.MIN_VALUE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " vượt phạm vi Integer");
        }
        return id.intValue();
    }

    private AuthResponse toAuthResponse(NguoiDung user, String accessToken) {
        AuthResponse.UserInfo userInfo = AuthResponse.UserInfo.builder()
                .id(user.getId().longValue())
                .email(user.getEmail())
                .firstName(user.getTen())
                .lastName(user.getHo())
                .role(user.getVaiTroHeThong().getTen())
                .isActive(user.getDangHoatDong())
                .build();

        AuthResponse.TokenData tokenData = AuthResponse.TokenData.builder()
                .accessToken(accessToken)
                .accessTokenExpiresIn(jwtService.getAccessTokenExpiresIn())
                .build();

        AuthResponse response = new AuthResponse();
        response.setUser(userInfo);
        response.setToken(tokenData);
        return response;
    }
}

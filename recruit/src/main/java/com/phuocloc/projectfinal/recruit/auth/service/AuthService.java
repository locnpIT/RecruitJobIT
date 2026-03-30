package com.phuocloc.projectfinal.recruit.auth.service;

import com.phuocloc.projectfinal.recruit.auth.dto.request.CreateOwnerRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.request.LoginRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.request.RegisterRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.response.AuthResponse;
import com.phuocloc.projectfinal.recruit.auth.dto.response.CreateOwnerResponse;
import com.phuocloc.projectfinal.recruit.auth.entity.Roles;
import com.phuocloc.projectfinal.recruit.auth.entity.Users;
import com.phuocloc.projectfinal.recruit.auth.enums.RegisterRole;
import com.phuocloc.projectfinal.recruit.auth.enums.RoleName;
import com.phuocloc.projectfinal.recruit.auth.repository.RolesRepository;
import com.phuocloc.projectfinal.recruit.auth.repository.UsersRepository;
import com.phuocloc.projectfinal.recruit.candidate.entity.CandidateProfile;
import com.phuocloc.projectfinal.recruit.candidate.repository.CandidateProfileRepository;
import com.phuocloc.projectfinal.recruit.company.dto.request.CreateEmployerRequest;
import com.phuocloc.projectfinal.recruit.company.dto.response.CreateEmployerResponse;
import com.phuocloc.projectfinal.recruit.company.entity.Company;
import com.phuocloc.projectfinal.recruit.company.entity.CompanyBranch;
import com.phuocloc.projectfinal.recruit.company.entity.CompanyProofDocument;
import com.phuocloc.projectfinal.recruit.company.entity.EmployerProfile;
import com.phuocloc.projectfinal.recruit.company.enums.CompanyProofDocumentStatus;
import com.phuocloc.projectfinal.recruit.company.enums.CompanyProofDocumentType;
import com.phuocloc.projectfinal.recruit.company.enums.CompanyStatus;
import com.phuocloc.projectfinal.recruit.company.enums.EmployerCompanyRole;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyBranchRepository;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyProofDocumentRepository;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyRepository;
import com.phuocloc.projectfinal.recruit.company.repository.EmployerProfileRepository;
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

        Roles candidateRole = requireRole(RoleName.CANDIDATE);

        Users user = Users.builder()
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .phoneNumber(trimToNull(request.getPhoneNumber()))
                .isActive(true)
                .isLocked(false)
                .role(candidateRole)
                .build();

        user = usersRepository.save(user);

        CandidateProfile candidateProfile = CandidateProfile.builder()
                .user(user)
                .build();
        candidateProfileRepository.save(candidateProfile);

        String accessToken = jwtService.generateAccessToken(user);
        return toAuthResponse(user, accessToken);
    }

    @Transactional
    public CreateOwnerResponse registerOwner(CreateOwnerRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        ensureEmailNotExists(normalizedEmail);

        Roles ownerRole = requireRole(RoleName.OWNER);
        String proofUrl = resolveProofUrl(request);

        Users owner = Users.builder()
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .phoneNumber(trimToNull(request.getPhoneNumber()))
                .isActive(true)
                .isLocked(false)
                .role(ownerRole)
                .build();
        owner = usersRepository.save(owner);

        Company company = Company.builder()
                .name(buildDefaultCompanyName(owner))
                .taxCode(generateTempTaxCode())
                .status(CompanyStatus.PENDING)
                .build();
        company = companyRepository.save(company);

        CompanyBranch headquarter = CompanyBranch.builder()
                .company(company)
                .name(company.getName() + " - Tru so chinh")
                .isHeadquarter(true)
                .build();
        headquarter = companyBranchRepository.save(headquarter);

        EmployerProfile ownerProfile = EmployerProfile.builder()
                .user(owner)
                .company(company)
                .branch(headquarter)
                .companyRole(EmployerCompanyRole.OWNER)
                .isActive(true)
                .build();
        employerProfileRepository.save(ownerProfile);

        CompanyProofDocument proofDocument = CompanyProofDocument.builder()
                .company(company)
                .fileUrl(proofUrl)
                .fileName(resolveProofFileName(proofUrl, request.getProofFile()))
                .fileType(resolveProofFileType(request.getProofFile()))
                .fileSize(resolveProofFileSize(request.getProofFile()))
                .documentType(CompanyProofDocumentType.OWNER_ID_CARD)
                .status(CompanyProofDocumentStatus.PENDING)
                .build();
        companyProofDocumentRepository.save(proofDocument);

        String accessToken = jwtService.generateAccessToken(owner);

        return CreateOwnerResponse.builder()
                .owner(CreateOwnerResponse.OwnerInfo.builder()
                        .id(owner.getId())
                        .email(owner.getEmail())
                        .firstName(owner.getFirstName())
                        .lastName(owner.getLastName())
                        .proofUrl(proofUrl)
                        .role(owner.getRole().getName().name())
                        .isActive(owner.getIsActive())
                        .isLocked(owner.getIsLocked())
                        .build())
                .token(CreateOwnerResponse.TokenData.builder()
                        .accessToken(accessToken)
                        .accessTokenExpiresIn(jwtService.getAccessTokenExpiresIn())
                        .build())
                .build();
    }

    @Transactional
    public CreateEmployerResponse createEmployerByOwner(Long ownerUserId, CreateEmployerRequest request) {
        EmployerProfile ownerProfile = requireOwnerProfile(ownerUserId);

        String normalizedEmail = normalizeEmail(request.getEmail());
        ensureEmailNotExists(normalizedEmail);

        Company ownerCompany = ownerProfile.getCompany();
        CompanyBranch branch = companyBranchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy chi nhánh"));

        if (!branch.getCompany().getId().equals(ownerCompany.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chi nhánh không thuộc công ty của OWNER");
        }

        Roles hrRole = requireRole(RoleName.HR);
        String temporaryPassword = generateTemporaryPassword(HR_TEMP_PASSWORD_LENGTH);

        Users hrUser = Users.builder()
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(temporaryPassword))
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .phoneNumber(trimToNull(request.getPhoneNumber()))
                .isActive(true)
                .isLocked(false)
                .role(hrRole)
                .build();
        hrUser = usersRepository.save(hrUser);

        EmployerProfile hrProfile = EmployerProfile.builder()
                .user(hrUser)
                .company(ownerCompany)
                .branch(branch)
                .companyRole(EmployerCompanyRole.HR)
                .isActive(true)
                .build();
        hrProfile = employerProfileRepository.save(hrProfile);

        hrCredentialMailService.sendInitialPassword(
                hrUser.getEmail(),
                hrUser.getFirstName(),
                hrUser.getLastName(),
                ownerCompany.getName(),
                temporaryPassword
        );

        return CreateEmployerResponse.builder()
                .employerProfileId(hrProfile.getId())
                .userId(hrUser.getId())
                .email(hrUser.getEmail())
                .firstName(hrUser.getFirstName())
                .lastName(hrUser.getLastName())
                .phoneNumber(hrUser.getPhoneNumber())
                .companyId(ownerCompany.getId())
                .branchId(branch.getId())
                .companyRole(hrProfile.getCompanyRole().name())
                .isActive(hrProfile.getIsActive())
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        Users user = usersRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sai email hoặc mật khẩu"));

        if (Boolean.TRUE.equals(user.getIsLocked())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản đang bị khóa");
        }
        if (!Boolean.TRUE.equals(user.getIsActive())) {
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

    private EmployerProfile requireOwnerProfile(Long ownerUserId) {
        if (ownerUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Thiếu thông tin người dùng đăng nhập");
        }

        EmployerProfile ownerProfile = employerProfileRepository.findByUser_Id(ownerUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Không tìm thấy hồ sơ OWNER"));

        if (ownerProfile.getCompanyRole() != EmployerCompanyRole.OWNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ OWNER mới được tạo HR");
        }

        if (!Boolean.TRUE.equals(ownerProfile.getIsActive())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Hồ sơ OWNER đang bị vô hiệu hóa");
        }

        return ownerProfile;
    }

    private String generateTemporaryPassword(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int index = SECURE_RANDOM.nextInt(TEMP_PASSWORD_ALPHABET.length());
            sb.append(TEMP_PASSWORD_ALPHABET.charAt(index));
        }
        return sb.toString();
    }

    private Roles requireRole(RoleName roleName) {
        return rolesRepository.findByName(roleName)
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

    private String buildDefaultCompanyName(Users owner) {
        return "Cong ty cua " + owner.getLastName() + " " + owner.getFirstName();
    }

    private String generateTempTaxCode() {
        String tempTaxCode;
        do {
            tempTaxCode = "TEMP-"
                    + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                    + "-"
                    + ThreadLocalRandom.current().nextInt(1000, 9999);
        } while (companyRepository.existsByTaxCode(tempTaxCode));

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

    private String resolveProofFileType(MultipartFile proofFile) {
        if (proofFile != null && StringUtils.hasText(proofFile.getContentType())) {
            return proofFile.getContentType();
        }
        return "application/octet-stream";
    }

    private Long resolveProofFileSize(MultipartFile proofFile) {
        if (proofFile != null && !proofFile.isEmpty()) {
            return proofFile.getSize();
        }
        return null;
    }

    private AuthResponse toAuthResponse(Users user, String accessToken) {
        AuthResponse.UserInfo userInfo = AuthResponse.UserInfo.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().getName().name())
                .isActive(user.getIsActive())
                .isLocked(user.getIsLocked())
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

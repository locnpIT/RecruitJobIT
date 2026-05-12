package com.phuocloc.projectfinal.recruit.auth.service;

import com.phuocloc.projectfinal.recruit.auth.dto.request.CreateOwnerRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.request.LoginRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.request.RegisterRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.request.UpdateAvatarRequest;
import com.phuocloc.projectfinal.recruit.auth.dto.response.AuthResponse;
import com.phuocloc.projectfinal.recruit.auth.dto.response.CreateOwnerResponse;
import com.phuocloc.projectfinal.recruit.auth.dto.response.UserProfileResponse;
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
import com.phuocloc.projectfinal.recruit.domain.diadiem.entity.XaPhuong;
import com.phuocloc.projectfinal.recruit.domain.diadiem.entity.TinhThanh;
import com.phuocloc.projectfinal.recruit.domain.diadiem.repository.TinhThanhRepository;
import com.phuocloc.projectfinal.recruit.domain.diadiem.repository.XaPhuongRepository;
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
import java.util.List;
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
/**
 * Nghiệp vụ xác thực và khởi tạo người dùng.
 *
 * <p>Service này xử lý các luồng quan trọng:
 * đăng ký candidate, đăng ký owner công ty, đăng nhập, cập nhật avatar
 * và tạo thêm nhân sự/employer từ phía owner.</p>
 */
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
    private final TinhThanhRepository tinhThanhRepository;
    private final XaPhuongRepository xaPhuongRepository;

    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final CloudinaryStorageService cloudinaryStorageService;
    private final HrCredentialMailService hrCredentialMailService;

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

        // Mỗi candidate được tạo sẵn một hồ sơ mặc định để frontend có thể thao tác ngay sau khi đăng nhập.
        HoSoUngVien hoSoUngVien = new HoSoUngVien();
        hoSoUngVien.setNguoiDung(user);
        candidateProfileRepository.save(hoSoUngVien);

        String accessToken = jwtService.generateAccessToken(user);
        return taoPhanHoiXacThuc(user, accessToken);
    }

    @Transactional
    public CreateOwnerResponse registerOwner(CreateOwnerRequest request) {
        // Owner cũng dùng role hệ thống CANDIDATE ở tầng auth,
        // còn quyền quản trị công ty sẽ được xác định qua membership/vai trò công ty.
        String normalizedEmail = normalizeEmail(request.getEmail());
        ensureEmailNotExists(normalizedEmail);

        VaiTroHeThong candidateRole = requireRole(RoleName.CANDIDATE);
        String proofUrl = resolveProofUrl(request);

        NguoiDung owner = new NguoiDung();
        owner.setEmail(normalizedEmail);
        owner.setMatKhauBam(passwordEncoder.encode(request.getMatKhau()));
        owner.setTen(request.getTen().trim());
        owner.setHo(request.getHo().trim());
        owner.setSoDienThoai(trimToNull(request.getSoDienThoai()));
        owner.setDangHoatDong(true);
        owner.setVaiTroHeThong(candidateRole);
        owner = usersRepository.save(owner);

        CongTy congTy = new CongTy();
        congTy.setTen(request.getTenCongTy().trim());
        congTy.setMaSoThue(request.getMaSoThue().trim());
        congTy.setMoTa(trimToNull(request.getMoTaCongTy()));
        congTy.setWebsite(trimToNull(request.getWebsite()));
        congTy.setTrangThai(CompanyStatus.PENDING.name());
        congTy.setChuCongTy(owner);
        congTy = companyRepository.save(congTy);

        List<ChiNhanhCongTy> chiNhanhs = createBranches(congTy, request.getChiNhanhs());

        VaiTroCongTy vaiTroOwner = requireCompanyRole(EmployerCompanyRole.OWNER);

        ThanhVienCongTy ownerProfile = new ThanhVienCongTy();
        ownerProfile.setNguoiDung(owner);
        ownerProfile.setChiNhanh(chiNhanhs.stream()
                .filter(branch -> Boolean.TRUE.equals(branch.getLaTruSoChinh()))
                .findFirst()
                .orElseGet(chiNhanhs::getFirst));
        ownerProfile.setVaiTroCongTy(vaiTroOwner);
        ownerProfile.setTrangThai("ACTIVE");
        employerProfileRepository.save(ownerProfile);

        LoaiTaiLieu loaiTaiLieu = resolveOrCreateLoaiTaiLieu(CompanyProofDocumentType.OWNER_ID_CARD.name());

        TepMinhChungCongTy proofDocument = new TepMinhChungCongTy();
        proofDocument.setCongTy(congTy);
        proofDocument.setLoaiTaiLieu(loaiTaiLieu);
        proofDocument.setDuongDanTep(proofUrl);
        proofDocument.setTenTep(resolveProofFileName(proofUrl, request.getTepMinhChung()));
        proofDocument.setTrangThai(CompanyProofDocumentStatus.PENDING.name());
        proofDocument.setNgayXoa(null);
        companyProofDocumentRepository.save(proofDocument);

        String accessToken = jwtService.generateAccessToken(owner);
        return taoPhanHoiTaoOwner(owner, congTy, chiNhanhs, proofUrl, accessToken);
    }

    @Transactional
    public CreateEmployerResponse createEmployerByOwner(Long ownerUserId, CreateEmployerRequest request) {
        ThanhVienCongTy ownerProfile = requireOwnerProfile(ownerUserId);

        String normalizedEmail = normalizeEmail(request.getEmail());
        ensureEmailNotExists(normalizedEmail);

        CongTy ownerCompany = requireOwnerCompany(ownerProfile);
        Integer branchId = toIntId(request.getChiNhanhId(), "chiNhanhId");

        ChiNhanhCongTy branch = companyBranchRepository.findById(branchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy chi nhánh"));

        if (!branch.getCongTy().getId().equals(ownerCompany.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chi nhánh không thuộc công ty của OWNER");
        }

        VaiTroHeThong candidateRole = requireRole(RoleName.CANDIDATE);
        VaiTroCongTy vaiTroCongTy = requireCompanyRole(parseCompanyRole(request.getVaiTroCongTy()));

        String temporaryPassword = generateTemporaryPassword(HR_TEMP_PASSWORD_LENGTH);

        NguoiDung hrUser = new NguoiDung();
        hrUser.setEmail(normalizedEmail);
        hrUser.setMatKhauBam(passwordEncoder.encode(temporaryPassword));
        hrUser.setTen(request.getTen().trim());
        hrUser.setHo(request.getHo().trim());
        hrUser.setSoDienThoai(trimToNull(request.getSoDienThoai()));
        hrUser.setDangHoatDong(true);
        hrUser.setVaiTroHeThong(candidateRole);
        hrUser = usersRepository.save(hrUser);

        ThanhVienCongTy hrProfile = new ThanhVienCongTy();
        hrProfile.setNguoiDung(hrUser);
        hrProfile.setChiNhanh(branch);
        hrProfile.setVaiTroCongTy(vaiTroCongTy);
        hrProfile.setTrangThai("ACTIVE");
        hrProfile = employerProfileRepository.save(hrProfile);

        hrCredentialMailService.sendInitialPassword(
                hrUser.getEmail(),
                hrUser.getTen(),
                hrUser.getHo(),
                ownerCompany.getTen(),
                temporaryPassword
        );

        return taoPhanHoiTaoNhaTuyenDung(hrUser, ownerCompany, branch, hrProfile);
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
        return taoPhanHoiXacThuc(user, accessToken);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile(Long userId) {
        NguoiDung user = usersRepository.findById(toIntId(userId, "userId"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
        return mapUserProfile(user);
    }

    @Transactional
    public UserProfileResponse updateAvatar(Long userId, UpdateAvatarRequest request) {
        if (request == null || !StringUtils.hasText(request.getAnhDaiDienUrl())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "anhDaiDienUrl không hợp lệ");
        }

        NguoiDung user = usersRepository.findById(toIntId(userId, "userId"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
        user.setAnhDaiDienUrl(request.getAnhDaiDienUrl().trim());
        user = usersRepository.save(user);
        return mapUserProfile(user);
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

    private EmployerCompanyRole parseCompanyRole(String rawRole) {
        if (!StringUtils.hasText(rawRole)) {
            return EmployerCompanyRole.HR;
        }

        try {
            return EmployerCompanyRole.valueOf(rawRole.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Vai trò công ty không hợp lệ: " + rawRole
            );
        }
    }

    private LoaiTaiLieu resolveOrCreateLoaiTaiLieu(String tenLoaiTaiLieu) {
        return loaiTaiLieuRepository.findByTenIgnoreCase(tenLoaiTaiLieu)
                .orElseGet(() -> {
                    LoaiTaiLieu loaiTaiLieu = new LoaiTaiLieu();
                    loaiTaiLieu.setTen(tenLoaiTaiLieu);
                    loaiTaiLieu.setMoTa("Tự tạo từ luồng đăng ký công ty");
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
        if (StringUtils.hasText(request.getDuongDanMinhChung())) {
            return request.getDuongDanMinhChung().trim();
        }

        MultipartFile proofFile = request.getTepMinhChung();
        if (proofFile == null || proofFile.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần tepMinhChung hoặc duongDanMinhChung");
        }

        return cloudinaryStorageService.uploadProof(proofFile);
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

    private List<ChiNhanhCongTy> createBranches(CongTy congTy, List<CreateOwnerRequest.BranchRequest> branchRequests) {
        if (branchRequests == null || branchRequests.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần ít nhất một chi nhánh");
        }

        boolean hasPrimary = branchRequests.stream().anyMatch(branch -> Boolean.TRUE.equals(branch.getLaTruSoChinh()));
        if (!hasPrimary) {
            branchRequests.getFirst().setLaTruSoChinh(true);
        }

        List<ChiNhanhCongTy> savedBranches = new java.util.ArrayList<>();
        for (CreateOwnerRequest.BranchRequest branchRequest : branchRequests) {
            ChiNhanhCongTy chiNhanhCongTy = new ChiNhanhCongTy();
            chiNhanhCongTy.setCongTy(congTy);
            chiNhanhCongTy.setTen(branchRequest.getTenChiNhanh().trim());
            chiNhanhCongTy.setDiaChiChiTiet(branchRequest.getDiaChiChiTietChiNhanh().trim());
            chiNhanhCongTy.setXaPhuong(resolveOrCreateXaPhuong(branchRequest));
            chiNhanhCongTy.setLaTruSoChinh(Boolean.TRUE.equals(branchRequest.getLaTruSoChinh()));
            savedBranches.add(companyBranchRepository.save(chiNhanhCongTy));
        }

        return savedBranches;
    }

    private XaPhuong resolveOrCreateXaPhuong(CreateOwnerRequest.BranchRequest branchRequest) {
        if (branchRequest.getXaPhuongId() != null) {
            return resolveXaPhuong(branchRequest.getXaPhuongId());
        }

        if (!StringUtils.hasText(branchRequest.getTenXaPhuong()) || branchRequest.getTinhThanhId() == null) {
            return null;
        }

        Integer tinhThanhId = toIntId(branchRequest.getTinhThanhId(), "tinhThanhId");
        TinhThanh tinhThanh = tinhThanhRepository.findById(tinhThanhId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tỉnh/thành"));

        return xaPhuongRepository.findByTinhThanh_IdAndTenIgnoreCase(tinhThanhId, branchRequest.getTenXaPhuong().trim())
                .orElseGet(() -> {
                    XaPhuong xaPhuong = new XaPhuong();
                    xaPhuong.setTen(branchRequest.getTenXaPhuong().trim());
                    xaPhuong.setMoTa("Tự tạo từ luồng đăng ký công ty");
                    xaPhuong.setTinhThanh(tinhThanh);
                    return xaPhuongRepository.save(xaPhuong);
                });
    }

    private XaPhuong resolveXaPhuong(Long xaPhuongId) {
        if (xaPhuongId == null) {
            return null;
        }
        Integer id = toIntId(xaPhuongId, "xaPhuongId");
        return xaPhuongRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy xã/phường"));
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

    private AuthResponse taoPhanHoiXacThuc(NguoiDung nguoiDung, String accessToken) {
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

    private UserProfileResponse mapUserProfile(NguoiDung user) {
        return UserProfileResponse.builder()
                .id(user.getId() == null ? null : user.getId().longValue())
                .email(user.getEmail())
                .ten(user.getTen())
                .ho(user.getHo())
                .soDienThoai(user.getSoDienThoai())
                .vaiTro(user.getVaiTroHeThong() == null ? null : user.getVaiTroHeThong().getTen())
                .dangHoatDong(user.getDangHoatDong())
                .anhDaiDienUrl(user.getAnhDaiDienUrl())
                .build();
    }

    private CreateOwnerResponse taoPhanHoiTaoOwner(
            NguoiDung owner,
            CongTy congTy,
            List<ChiNhanhCongTy> chiNhanhs,
            String duongDanMinhChung,
            String accessToken
    ) {
        CreateOwnerResponse.ThongTinChuSoHuu chuSoHuu = CreateOwnerResponse.ThongTinChuSoHuu.builder()
                .id(owner.getId() == null ? null : owner.getId().longValue())
                .email(owner.getEmail())
                .ten(owner.getTen())
                .ho(owner.getHo())
                .duongDanMinhChung(duongDanMinhChung)
                .vaiTroHeThong(owner.getVaiTroHeThong() == null ? null : owner.getVaiTroHeThong().getTen())
                .vaiTroCongTy(ownerCompanyRole(owner))
                .dangHoatDong(owner.getDangHoatDong())
                .build();

        CreateOwnerResponse.ThongTinCongTy thongTinCongTy = CreateOwnerResponse.ThongTinCongTy.builder()
                .id(congTy.getId() == null ? null : congTy.getId().longValue())
                .ten(congTy.getTen())
                .maSoThue(congTy.getMaSoThue())
                .website(congTy.getWebsite())
                .moTa(congTy.getMoTa())
                .trangThai(congTy.getTrangThai())
                .build();

        List<CreateOwnerResponse.ThongTinChiNhanh> thongTinChiNhanhs = chiNhanhs.stream()
                .map(branch -> CreateOwnerResponse.ThongTinChiNhanh.builder()
                        .id(branch.getId() == null ? null : branch.getId().longValue())
                        .ten(branch.getTen())
                        .diaChiChiTiet(branch.getDiaChiChiTiet())
                        .xaPhuongId(branch.getXaPhuong() == null || branch.getXaPhuong().getId() == null
                                ? null
                                : branch.getXaPhuong().getId().longValue())
                        .xaPhuongTen(branch.getXaPhuong() == null ? null : branch.getXaPhuong().getTen())
                        .laTruSoChinh(branch.getLaTruSoChinh())
                        .build())
                .toList();

        AuthResponse.ThongTinPhienDangNhap phienDangNhap = AuthResponse.ThongTinPhienDangNhap.builder()
                .accessToken(accessToken)
                .thoiHanTokenGiay(jwtService.getAccessTokenExpiresIn())
                .build();

        return CreateOwnerResponse.builder()
                .chuSoHuu(chuSoHuu)
                .congTy(thongTinCongTy)
                .chiNhanhs(thongTinChiNhanhs)
                .phienDangNhap(phienDangNhap)
                .build();
    }

    private CreateEmployerResponse taoPhanHoiTaoNhaTuyenDung(
            NguoiDung hrUser,
            CongTy ownerCompany,
            ChiNhanhCongTy branch,
            ThanhVienCongTy hrProfile
    ) {
        return CreateEmployerResponse.builder()
                .hoSoNhaTuyenDungId(hrUser.getId() == null ? null : hrUser.getId().longValue())
                .nguoiDungId(hrUser.getId() == null ? null : hrUser.getId().longValue())
                .email(hrUser.getEmail())
                .ten(hrUser.getTen())
                .ho(hrUser.getHo())
                .soDienThoai(hrUser.getSoDienThoai())
                .congTyId(ownerCompany.getId() == null ? null : ownerCompany.getId().longValue())
                .chiNhanhId(branch.getId() == null ? null : branch.getId().longValue())
                .vaiTroHeThong(hrUser.getVaiTroHeThong() == null ? null : hrUser.getVaiTroHeThong().getTen())
                .vaiTroCongTy(hrProfile.getVaiTroCongTy() == null ? null : hrProfile.getVaiTroCongTy().getTen())
                .dangHoatDong(hrUser.getDangHoatDong())
                .build();
    }

    private String ownerCompanyRole(NguoiDung owner) {
        return employerProfileRepository.findFirstByNguoiDung_IdAndVaiTroCongTy_TenIgnoreCase(
                        owner.getId().intValue(),
                        EmployerCompanyRole.OWNER.name()
                )
                .map(profile -> profile.getVaiTroCongTy() == null ? null : profile.getVaiTroCongTy().getTen())
                .orElse(EmployerCompanyRole.OWNER.name());
    }

}

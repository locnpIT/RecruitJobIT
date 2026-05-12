package com.phuocloc.projectfinal.recruit.company.service;

import com.phuocloc.projectfinal.recruit.auth.enums.RoleName;
import com.phuocloc.projectfinal.recruit.auth.repository.RolesRepository;
import com.phuocloc.projectfinal.recruit.auth.repository.UsersRepository;
import com.phuocloc.projectfinal.recruit.company.dto.request.CreateCompanyHrRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.UpdateCompanyHrRequest;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyAdminHrResponse;
import com.phuocloc.projectfinal.recruit.company.enums.EmployerCompanyRole;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyBranchRepository;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyRepository;
import com.phuocloc.projectfinal.recruit.company.repository.EmployerProfileRepository;
import com.phuocloc.projectfinal.recruit.company.repository.ThanhVienCongTyRepository;
import com.phuocloc.projectfinal.recruit.company.repository.VaiTroCongTyRepository;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ChiNhanhCongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.CongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ThanhVienCongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.VaiTroCongTy;
import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.VaiTroHeThong;
import com.phuocloc.projectfinal.recruit.infrastructure.mail.HrCredentialMailService;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
/**
 * Nghiệp vụ quản lý tài khoản HR trong công ty.
 *
 * <p>Owner sử dụng service này để tạo, cập nhật, xóa và xem danh sách HR
 * đang thuộc công ty của mình.</p>
 */
public class CompanyHrManagementService {

    private static final String COMPANY_NOT_APPROVED_MESSAGE = "Công ty chưa được duyệt, chỉ có thể cập nhật logo";
    private static final Set<String> HR_ROLES = Set.of(EmployerCompanyRole.HR.name());

    private final UsersRepository usersRepository;
    private final RolesRepository rolesRepository;
    private final CompanyRepository companyRepository;
    private final CompanyBranchRepository companyBranchRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final ThanhVienCongTyRepository thanhVienCongTyRepository;
    private final VaiTroCongTyRepository vaiTroCongTyRepository;
    private final PasswordEncoder passwordEncoder;
    private final HrCredentialMailService hrCredentialMailService;

    @Transactional(readOnly = true)
    public List<CompanyAdminHrResponse> getHrAccounts(Integer ownerUserId) {
        // Chỉ owner của công ty đã được duyệt mới được xem/điều hành HR.
        CongTy company = requireApprovedOwnerCompany(ownerUserId);
        List<ThanhVienCongTy> memberships = employerProfileRepository.findByChiNhanh_CongTy_IdAndNguoiDung_DangHoatDongTrue(company.getId()).stream()
                .filter(this::isActiveMembership)
                .filter(this::isHrMembership)
                .sorted(Comparator.comparing(ThanhVienCongTy::getNgayTao, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .toList();

        Map<Integer, List<ThanhVienCongTy>> groupedByUser = memberships.stream()
                .collect(Collectors.groupingBy(
                        membership -> membership.getNguoiDung().getId(),
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        return groupedByUser.values().stream()
                .map(this::mapHrAccount)
                .toList();
    }

    @Transactional
    public CompanyAdminHrResponse createHrAccount(Integer ownerUserId, CreateCompanyHrRequest request) {
        // Tạo user HR mới + gán membership vào các chi nhánh được chọn + gửi email thông tin truy cập.
        CongTy company = requireApprovedOwnerCompany(ownerUserId);

        String email = normalizeEmail(request.getEmail());
        ensureEmailNotExists(email);

        List<ChiNhanhCongTy> branches = resolveBranchesForCompany(company, request.getChiNhanhIds());
        VaiTroHeThong candidateRole = requireRole(RoleName.CANDIDATE);
        VaiTroCongTy hrRole = requireCompanyRole(EmployerCompanyRole.HR);

        NguoiDung hrUser = new NguoiDung();
        hrUser.setEmail(email);
        hrUser.setMatKhauBam(passwordEncoder.encode(request.getMatKhau()));
        hrUser.setTen(request.getTen().trim());
        hrUser.setHo(request.getHo().trim());
        hrUser.setSoDienThoai(trimToNull(request.getSoDienThoai()));
        hrUser.setDangHoatDong(true);
        hrUser.setVaiTroHeThong(candidateRole);
        hrUser = usersRepository.save(hrUser);

        List<ThanhVienCongTy> memberships = new ArrayList<>();
        for (ChiNhanhCongTy branch : branches) {
            ThanhVienCongTy membership = new ThanhVienCongTy();
            membership.setNguoiDung(hrUser);
            membership.setChiNhanh(branch);
            membership.setVaiTroCongTy(hrRole);
            membership.setTrangThai("ACTIVE");
            memberships.add(membership);
        }
        thanhVienCongTyRepository.saveAll(memberships);

        hrCredentialMailService.sendInitialPassword(
                hrUser.getEmail(),
                hrUser.getTen(),
                hrUser.getHo(),
                company.getTen(),
                request.getMatKhau()
        );

        return buildHrResponse(hrUser, memberships);
    }

    @Transactional
    public CompanyAdminHrResponse updateHrAccount(Integer ownerUserId, Long hrUserId, UpdateCompanyHrRequest request) {
        CongTy company = requireApprovedOwnerCompany(ownerUserId);
        NguoiDung hrUser = requireManagedHrUser(company, hrUserId);
        List<ChiNhanhCongTy> branches = resolveBranchesForCompany(company, request.getChiNhanhIds());

        String nextEmail = normalizeEmail(request.getEmail());
        if (!nextEmail.equalsIgnoreCase(hrUser.getEmail())) {
            ensureEmailNotExists(nextEmail);
        }
        hrUser.setEmail(nextEmail);
        hrUser.setTen(request.getTen().trim());
        hrUser.setHo(request.getHo().trim());
        hrUser.setSoDienThoai(trimToNull(request.getSoDienThoai()));
        if (request.getDangHoatDong() != null) {
            hrUser.setDangHoatDong(request.getDangHoatDong());
        }
        hrUser = usersRepository.save(hrUser);

        List<ThanhVienCongTy> currentMemberships = employerProfileRepository.findByNguoiDung_IdAndNgayXoaIsNull(hrUser.getId()).stream()
                .filter(this::isHrMembership)
                .filter(membership -> membership.getChiNhanh() != null
                        && membership.getChiNhanh().getCongTy() != null
                        && Objects.equals(membership.getChiNhanh().getCongTy().getId(), company.getId()))
                .toList();

        if (!currentMemberships.isEmpty()) {
            thanhVienCongTyRepository.deleteAll(currentMemberships);
        }

        VaiTroCongTy hrRole = requireCompanyRole(EmployerCompanyRole.HR);
        List<ThanhVienCongTy> memberships = new ArrayList<>();
        for (ChiNhanhCongTy branch : branches) {
            ThanhVienCongTy membership = new ThanhVienCongTy();
            membership.setNguoiDung(hrUser);
            membership.setChiNhanh(branch);
            membership.setVaiTroCongTy(hrRole);
            membership.setTrangThai("ACTIVE");
            memberships.add(membership);
        }
        memberships = thanhVienCongTyRepository.saveAll(memberships);
        return buildHrResponse(hrUser, memberships);
    }

    @Transactional
    public void deleteHrAccount(Integer ownerUserId, Long hrUserId) {
        CongTy company = requireApprovedOwnerCompany(ownerUserId);
        NguoiDung hrUser = requireManagedHrUser(company, hrUserId);

        hrUser.setDangHoatDong(false);
        hrUser.setNgayXoa(LocalDateTime.now());
        usersRepository.save(hrUser);

        List<ThanhVienCongTy> currentMemberships = employerProfileRepository.findByNguoiDung_IdAndNgayXoaIsNull(hrUser.getId()).stream()
                .filter(this::isHrMembership)
                .filter(membership -> membership.getChiNhanh() != null
                        && membership.getChiNhanh().getCongTy() != null
                        && Objects.equals(membership.getChiNhanh().getCongTy().getId(), company.getId()))
                .toList();

        for (ThanhVienCongTy membership : currentMemberships) {
            membership.setTrangThai("INACTIVE");
            membership.setNgayXoa(LocalDateTime.now());
        }
        if (!currentMemberships.isEmpty()) {
            thanhVienCongTyRepository.saveAll(currentMemberships);
        }
    }

    private CompanyAdminHrResponse buildHrResponse(NguoiDung user, List<ThanhVienCongTy> memberships) {
        List<CompanyAdminHrResponse.ThongTinChiNhanh> branches = memberships.stream()
                .map(this::mapHrBranch)
                .toList();

        return CompanyAdminHrResponse.builder()
                .nguoiDungId(user.getId() == null ? null : user.getId().longValue())
                .email(user.getEmail())
                .ten(user.getTen())
                .ho(user.getHo())
                .soDienThoai(user.getSoDienThoai())
                .vaiTroHeThong(user.getVaiTroHeThong() == null ? null : user.getVaiTroHeThong().getTen())
                .vaiTroCongTy(memberships.isEmpty() || memberships.getFirst().getVaiTroCongTy() == null
                        ? null
                        : memberships.getFirst().getVaiTroCongTy().getTen())
                .dangHoatDong(user.getDangHoatDong())
                .matKhauTam(null)
                .chiNhanhs(branches)
                .build();
    }

    private CompanyAdminHrResponse mapHrAccount(List<ThanhVienCongTy> memberships) {
        if (memberships == null || memberships.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể ánh xạ dữ liệu HR");
        }
        ThanhVienCongTy firstMembership = memberships.getFirst();
        return CompanyAdminHrResponse.builder()
                .nguoiDungId(firstMembership.getNguoiDung() == null || firstMembership.getNguoiDung().getId() == null
                        ? null
                        : firstMembership.getNguoiDung().getId().longValue())
                .email(firstMembership.getNguoiDung() == null ? null : firstMembership.getNguoiDung().getEmail())
                .ten(firstMembership.getNguoiDung() == null ? null : firstMembership.getNguoiDung().getTen())
                .ho(firstMembership.getNguoiDung() == null ? null : firstMembership.getNguoiDung().getHo())
                .soDienThoai(firstMembership.getNguoiDung() == null ? null : firstMembership.getNguoiDung().getSoDienThoai())
                .vaiTroHeThong(firstMembership.getNguoiDung() == null || firstMembership.getNguoiDung().getVaiTroHeThong() == null
                        ? null
                        : firstMembership.getNguoiDung().getVaiTroHeThong().getTen())
                .vaiTroCongTy(firstMembership.getVaiTroCongTy() == null ? null : firstMembership.getVaiTroCongTy().getTen())
                .dangHoatDong(firstMembership.getNguoiDung() == null ? null : firstMembership.getNguoiDung().getDangHoatDong())
                .chiNhanhs(memberships.stream().map(this::mapHrBranch).toList())
                .build();
    }

    private CompanyAdminHrResponse.ThongTinChiNhanh mapHrBranch(ThanhVienCongTy membership) {
        ChiNhanhCongTy branch = membership.getChiNhanh();
        return CompanyAdminHrResponse.ThongTinChiNhanh.builder()
                .chiNhanhId(branch == null || branch.getId() == null ? null : branch.getId().longValue())
                .chiNhanhTen(branch == null ? null : branch.getTen())
                .laTruSoChinh(branch != null && Boolean.TRUE.equals(branch.getLaTruSoChinh()))
                .build();
    }

    private CongTy requireOwnerCompany(Integer ownerUserId) {
        if (ownerUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Thiếu thông tin người dùng đăng nhập");
        }

        ThanhVienCongTy ownerMembership = employerProfileRepository
                .findFirstByNguoiDung_IdAndVaiTroCongTy_TenIgnoreCase(ownerUserId, EmployerCompanyRole.OWNER.name())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ OWNER mới được tạo HR"));

        if (!Boolean.TRUE.equals(ownerMembership.getNguoiDung().getDangHoatDong())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Hồ sơ OWNER đang bị vô hiệu hóa");
        }

        if (ownerMembership.getChiNhanh() == null || ownerMembership.getChiNhanh().getCongTy() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không xác định được công ty quản lý");
        }

        Integer companyId = ownerMembership.getChiNhanh().getCongTy().getId();
        if (companyId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không xác định được công ty quản lý");
        }

        return companyRepository.findById(companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy công ty"));
    }

    private NguoiDung requireManagedHrUser(CongTy company, Long hrUserId) {
        if (hrUserId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "hrUserId không được để trống");
        }
        NguoiDung hrUser = usersRepository.findById(Math.toIntExact(hrUserId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản HR"));

        boolean belongsToCompany = employerProfileRepository.findByNguoiDung_IdAndNgayXoaIsNull(hrUser.getId()).stream()
                .filter(this::isHrMembership)
                .anyMatch(membership -> membership.getChiNhanh() != null
                        && membership.getChiNhanh().getCongTy() != null
                        && Objects.equals(membership.getChiNhanh().getCongTy().getId(), company.getId()));
        if (!belongsToCompany) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản HR không thuộc công ty hiện tại");
        }
        return hrUser;
    }

    private CongTy requireApprovedOwnerCompany(Integer ownerUserId) {
        CongTy company = requireOwnerCompany(ownerUserId);
        if (!"APPROVED".equalsIgnoreCase(company.getTrangThai())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, COMPANY_NOT_APPROVED_MESSAGE);
        }
        return company;
    }

    private List<ChiNhanhCongTy> resolveBranchesForCompany(CongTy company, List<Long> branchIds) {
        if (branchIds == null || branchIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần chọn ít nhất một chi nhánh");
        }

        List<Integer> normalizedIds = branchIds.stream()
                .filter(Objects::nonNull)
                .map(this::toIntId)
                .distinct()
                .toList();
        if (normalizedIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần chọn ít nhất một chi nhánh hợp lệ");
        }

        List<ChiNhanhCongTy> branches = companyBranchRepository.findAllById(normalizedIds);
        if (branches.size() != normalizedIds.size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Một hoặc nhiều chi nhánh không tồn tại");
        }

        for (ChiNhanhCongTy branch : branches) {
            if (branch.getCongTy() == null || branch.getCongTy().getId() == null || !Objects.equals(branch.getCongTy().getId(), company.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chi nhánh không thuộc công ty hiện tại");
            }
        }

        return branches;
    }

    private boolean isActiveMembership(ThanhVienCongTy membership) {
        return membership != null
                && membership.getNguoiDung() != null
                && Boolean.TRUE.equals(membership.getNguoiDung().getDangHoatDong())
                && membership.getChiNhanh() != null
                && membership.getChiNhanh().getCongTy() != null
                && "ACTIVE".equalsIgnoreCase(membership.getTrangThai());
    }

    private boolean isHrMembership(ThanhVienCongTy membership) {
        return membership != null
                && membership.getVaiTroCongTy() != null
                && HR_ROLES.contains(membership.getVaiTroCongTy().getTen().toUpperCase(Locale.ROOT));
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

    private void ensureEmailNotExists(String email) {
        if (usersRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email đã tồn tại");
        }
    }

    private String normalizeEmail(String email) {
        if (!StringUtils.hasText(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email không được để trống");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private Integer toIntId(Long id) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID không được để trống");
        }
        if (id > Integer.MAX_VALUE || id < Integer.MIN_VALUE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID vượt phạm vi Integer");
        }
        return id.intValue();
    }
}

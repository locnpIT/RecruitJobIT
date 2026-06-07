package com.phuocloc.projectfinal.recruit.admin.service;

import com.phuocloc.projectfinal.recruit.admin.dto.request.CreateAdminUserRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.request.UpdateUserStatusRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminUserResponse;
import com.phuocloc.projectfinal.recruit.auth.enums.RoleName;
import com.phuocloc.projectfinal.recruit.auth.repository.RolesRepository;
import com.phuocloc.projectfinal.recruit.company.enums.EmployerCompanyRole;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyBranchRepository;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyRepository;
import com.phuocloc.projectfinal.recruit.auth.repository.UsersRepository;
import com.phuocloc.projectfinal.recruit.company.repository.ThanhVienCongTyRepository;
import com.phuocloc.projectfinal.recruit.company.repository.VaiTroCongTyRepository;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ChiNhanhCongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.CongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ThanhVienCongTy;
import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;
import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.VaiTroHeThong;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.VaiTroCongTy;
import com.phuocloc.projectfinal.recruit.common.util.ServiceUtils;
import com.phuocloc.projectfinal.recruit.infrastructure.mail.HrCredentialMailService;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
/**
 * Nghiệp vụ quản lý user ở khu admin.
 *
 * <p>Phục vụ list/filter user, khóa mở tài khoản và xóa mềm người dùng.</p>
 */
public class AdminUserService {

    private final UsersRepository usersRepository;
    private final RolesRepository rolesRepository;
    private final CompanyRepository companyRepository;
    private final CompanyBranchRepository companyBranchRepository;
    private final ThanhVienCongTyRepository thanhVienCongTyRepository;
    private final VaiTroCongTyRepository vaiTroCongTyRepository;
    private final PasswordEncoder passwordEncoder;
    private final HrCredentialMailService hrCredentialMailService;

    @Transactional(readOnly = true)
    public List<AdminUserResponse> listUsers(String keyword, String role, String status) {
        // Lọc hiện đang thực hiện in-memory trên tập user hiện có.
        String normalizedKeyword = ServiceUtils.normalize(keyword);
        String normalizedRole = ServiceUtils.normalize(role);
        String normalizedStatus = ServiceUtils.normalize(status);

        return usersRepository.findAll(Sort.by(Sort.Direction.DESC, "ngayTao")).stream()
                .filter(user -> user.getNgayXoa() == null)
                .filter(user -> matchesKeyword(user, normalizedKeyword))
                .filter(user -> matchesRole(user, normalizedRole))
                .filter(user -> matchesStatus(user, normalizedStatus))
                .map(this::mapUser)
                .toList();
    }

    @Transactional
    public AdminUserResponse createUser(CreateAdminUserRequest request) {
        String accountType = ServiceUtils.normalize(request.getLoaiTaiKhoan()).toUpperCase(Locale.ROOT);
        return switch (accountType) {
            case "ADMIN" -> createStandaloneUser(request, RoleName.ADMIN);
            case "CANDIDATE" -> createStandaloneUser(request, RoleName.CANDIDATE);
            case "COMPANY_ADMIN" -> createCompanyAdmin(request);
            case "HR" -> createHrUser(request);
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loại tài khoản không hợp lệ");
        };
    }

    private AdminUserResponse createStandaloneUser(CreateAdminUserRequest request, RoleName roleName) {
        String normalizedEmail = ServiceUtils.normalizeEmail(request.getEmail());
        ensureEmailNotExists(normalizedEmail);

        VaiTroHeThong role = requireSystemRole(roleName);
        NguoiDung user = buildUser(request, normalizedEmail, role);
        return mapUser(usersRepository.save(user));
    }

    private AdminUserResponse createCompanyAdmin(CreateAdminUserRequest request) {
        String normalizedEmail = ServiceUtils.normalizeEmail(request.getEmail());
        ensureEmailNotExists(normalizedEmail);

        String companyName = requireText(request.getTenCongTy(), "Tên công ty không được để trống");
        String taxCode = requireText(request.getMaSoThue(), "Mã số thuế không được để trống");
        String branchName = requireText(request.getTenChiNhanh(), "Tên chi nhánh không được để trống");
        String branchAddress = requireText(request.getDiaChiChiTietChiNhanh(), "Địa chỉ chi nhánh không được để trống");

        if (companyRepository.existsByMaSoThue(taxCode)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã số thuế đã tồn tại");
        }

        NguoiDung owner = usersRepository.save(buildUser(request, normalizedEmail, requireSystemRole(RoleName.CANDIDATE)));

        CongTy company = new CongTy();
        company.setTen(companyName);
        company.setMaSoThue(taxCode);
        company.setWebsite(ServiceUtils.trimToNull(request.getWebsite()));
        company.setMoTa(ServiceUtils.trimToNull(request.getMoTaCongTy()));
        company.setTrangThai("APPROVED");
        company.setChuCongTy(owner);
        company = companyRepository.save(company);

        ChiNhanhCongTy branch = new ChiNhanhCongTy();
        branch.setCongTy(company);
        branch.setTen(branchName);
        branch.setDiaChiChiTiet(branchAddress);
        branch.setLaTruSoChinh(true);
        branch = companyBranchRepository.save(branch);

        ThanhVienCongTy membership = new ThanhVienCongTy();
        membership.setNguoiDung(owner);
        membership.setChiNhanh(branch);
        membership.setVaiTroCongTy(requireCompanyRole(EmployerCompanyRole.OWNER));
        membership.setTrangThai("ACTIVE");
        thanhVienCongTyRepository.save(membership);

        hrCredentialMailService.sendInitialPassword(
                owner.getEmail(),
                owner.getTen(),
                owner.getHo(),
                company.getTen(),
                request.getMatKhau()
        );

        return mapUser(owner);
    }

    private AdminUserResponse createHrUser(CreateAdminUserRequest request) {
        String normalizedEmail = ServiceUtils.normalizeEmail(request.getEmail());
        ensureEmailNotExists(normalizedEmail);

        CongTy company = requireCompany(request.getCongTyId());
        List<ChiNhanhCongTy> branches = resolveBranchesForCompany(company, request.getChiNhanhIds());
        NguoiDung hrUser = usersRepository.save(buildUser(request, normalizedEmail, requireSystemRole(RoleName.CANDIDATE)));
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
        thanhVienCongTyRepository.saveAll(memberships);

        hrCredentialMailService.sendInitialPassword(
                hrUser.getEmail(),
                hrUser.getTen(),
                hrUser.getHo(),
                company.getTen(),
                request.getMatKhau()
        );

        return mapUser(hrUser);
    }

    @Transactional
    public AdminUserResponse updateUserStatus(Long userId, UpdateUserStatusRequest request) {
        NguoiDung user = usersRepository.findById(ServiceUtils.toIntId(userId, "userId"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));

        user.setDangHoatDong(request.getDangHoatDong());
        user = usersRepository.save(user);
        return mapUser(user);
    }

    @Transactional
    public void deleteUser(Long userId) {
        // Xóa mềm để vẫn giữ lịch sử dữ liệu liên quan thay vì xóa cứng.
        NguoiDung user = usersRepository.findById(ServiceUtils.toIntId(userId, "userId"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
        user.setDangHoatDong(false);
        user.setNgayXoa(LocalDateTime.now());
        usersRepository.save(user);
    }

    private AdminUserResponse mapUser(NguoiDung user) {
        List<ThanhVienCongTy> memberships = thanhVienCongTyRepository.findActiveMembershipsByUserId(user.getId());
        ThanhVienCongTy firstMembership = memberships.stream().findFirst().orElse(null);

        return AdminUserResponse.builder()
                .id(ServiceUtils.toLong(user.getId()))
                .hoTen(ServiceUtils.buildFullName(user.getHo(), user.getTen()))
                .email(user.getEmail())
                .soDienThoai(user.getSoDienThoai())
                .vaiTroHeThong(user.getVaiTroHeThong() == null ? null : user.getVaiTroHeThong().getTen())
                .dangHoatDong(Boolean.TRUE.equals(user.getDangHoatDong()))
                .trangThai(resolveUserStatus(user))
                .congTyTen(firstMembership == null || firstMembership.getChiNhanh() == null || firstMembership.getChiNhanh().getCongTy() == null
                        ? null
                        : firstMembership.getChiNhanh().getCongTy().getTen())
                .vaiTroCongTy(firstMembership == null || firstMembership.getVaiTroCongTy() == null
                        ? null
                        : firstMembership.getVaiTroCongTy().getTen())
                .chiNhanhTen(firstMembership == null || firstMembership.getChiNhanh() == null
                        ? null
                        : firstMembership.getChiNhanh().getTen())
                .ngayTao(user.getNgayTao())
                .ngayCapNhat(user.getNgayCapNhat())
                .build();
    }

    private boolean matchesKeyword(NguoiDung user, String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return true;
        }

        String fullName = ServiceUtils.normalize(ServiceUtils.buildFullName(user.getHo(), user.getTen()));
        return ServiceUtils.contains(fullName, keyword)
                || ServiceUtils.contains(ServiceUtils.normalize(user.getEmail()), keyword)
                || ServiceUtils.contains(ServiceUtils.normalize(user.getSoDienThoai()), keyword);
    }

    private boolean matchesRole(NguoiDung user, String role) {
        if (!StringUtils.hasText(role)) {
            return true;
        }
        return user.getVaiTroHeThong() != null && role.equalsIgnoreCase(user.getVaiTroHeThong().getTen());
    }

    private boolean matchesStatus(NguoiDung user, String status) {
        if (!StringUtils.hasText(status)) {
            return true;
        }

        String normalized = status.toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "ACTIVE" -> Boolean.TRUE.equals(user.getDangHoatDong());
            case "INACTIVE" -> Boolean.FALSE.equals(user.getDangHoatDong());
            case "DELETED" -> user.getNgayXoa() != null;
            default -> true;
        };
    }

    private String resolveUserStatus(NguoiDung user) {
        if (user.getNgayXoa() != null) {
            return "DELETED";
        }
        return Boolean.TRUE.equals(user.getDangHoatDong()) ? "ACTIVE" : "INACTIVE";
    }

    private NguoiDung buildUser(CreateAdminUserRequest request, String normalizedEmail, VaiTroHeThong role) {
        NguoiDung user = new NguoiDung();
        user.setEmail(normalizedEmail);
        user.setMatKhauBam(passwordEncoder.encode(requireText(request.getMatKhau(), "Mật khẩu không được để trống")));
        user.setHo(requireText(request.getHo(), "Họ không được để trống"));
        user.setTen(requireText(request.getTen(), "Tên không được để trống"));
        user.setSoDienThoai(ServiceUtils.trimToNull(request.getSoDienThoai()));
        user.setDangHoatDong(Boolean.TRUE.equals(request.getDangHoatDong()));
        user.setVaiTroHeThong(role);
        return user;
    }

    private VaiTroHeThong requireSystemRole(RoleName roleName) {
        return rolesRepository.findByTenIgnoreCase(roleName.name())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Thiếu role trong DB: " + roleName
                ));
    }

    private VaiTroCongTy requireCompanyRole(EmployerCompanyRole roleName) {
        return vaiTroCongTyRepository.findByTenIgnoreCase(roleName.name())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Thiếu vai trò công ty trong DB: " + roleName
                ));
    }

    private CongTy requireCompany(Long companyId) {
        Integer safeCompanyId = ServiceUtils.toIntId(companyId, "congTyId");
        CongTy company = companyRepository.findById(safeCompanyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy công ty"));
        if (company.getNgayXoa() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Công ty đã bị xoá");
        }
        return company;
    }

    private List<ChiNhanhCongTy> resolveBranchesForCompany(CongTy company, List<Long> branchIds) {
        if (branchIds == null || branchIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần chọn ít nhất một chi nhánh");
        }

        List<ChiNhanhCongTy> branches = new ArrayList<>();
        for (Long branchId : branchIds.stream().distinct().toList()) {
            ChiNhanhCongTy branch = companyBranchRepository.findById(ServiceUtils.toIntId(branchId, "chiNhanhId"))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy chi nhánh"));
            if (branch.getNgayXoa() != null
                    || branch.getCongTy() == null
                    || !Objects.equals(branch.getCongTy().getId(), company.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chi nhánh không thuộc công ty đã chọn");
            }
            branches.add(branch);
        }
        return branches;
    }

    private void ensureEmailNotExists(String email) {
        if (usersRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email đã tồn tại");
        }
    }

    private String requireText(String value, String message) {
        if (!StringUtils.hasText(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value.trim();
    }
}

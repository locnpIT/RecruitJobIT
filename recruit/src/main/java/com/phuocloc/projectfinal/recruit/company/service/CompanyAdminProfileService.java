package com.phuocloc.projectfinal.recruit.company.service;

import com.phuocloc.projectfinal.recruit.auth.repository.UsersRepository;
import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.company.dto.request.UpdateCompanyInfoRequest;
import com.phuocloc.projectfinal.recruit.company.dto.request.UpdateCompanyLogoRequest;
import com.phuocloc.projectfinal.recruit.company.dto.response.CompanyAdminMeResponse;
import com.phuocloc.projectfinal.recruit.company.enums.EmployerCompanyRole;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyBranchRepository;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyRepository;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ChiNhanhCongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.CongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.DangKyGoiCongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ThanhVienCongTy;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CompanyAdminProfileService {

    private static final String COMPANY_NOT_APPROVED_MESSAGE = "Công ty chưa được duyệt, chỉ có thể cập nhật logo";

    private final CompanyAdminAccessService accessService;
    private final CompanyAdminPackageService packageService;
    private final UsersRepository usersRepository;
    private final CompanyRepository companyRepository;
    private final CompanyBranchRepository companyBranchRepository;

    public CompanyAdminMeResponse getMe(AppUserPrinciple principal) {
        // API hydrate dashboard: gom thông tin user, công ty và chi nhánh được phép thao tác.
        Integer userId = principal.getUserId().intValue();
        List<ThanhVienCongTy> memberships = accessService.getActiveMemberships(userId);
        if (memberships.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Người dùng không thuộc công ty nào");
        }

        ThanhVienCongTy firstMembership = memberships.getFirst();
        var user = usersRepository.findById(userId).orElse(null);
        CompanyAdminMeResponse.ThongTinNguoiDung nguoiDung = CompanyAdminMeResponse.ThongTinNguoiDung.builder()
                .id(principal.getUserId())
                .email(principal.getEmail())
                .ten(user == null ? null : user.getTen())
                .ho(user == null ? null : user.getHo())
                .vaiTroHeThong(principal.getRole().name())
                .dangHoatDong(principal.isEnabled())
                .build();

        CompanyAdminMeResponse.ThongTinCongTy congTy = mapCompanyResponse(firstMembership.getChiNhanh().getCongTy());

        boolean laChuCongTy = memberships.stream().anyMatch(this::isOwnerMembership);
        List<CompanyAdminMeResponse.ThongTinChiNhanh> chiNhanhs = laChuCongTy
                ? listOwnerBranches(firstMembership)
                : memberships.stream().map(this::mapBranchMembership).toList();

        return CompanyAdminMeResponse.builder()
                .nguoiDung(nguoiDung)
                .congTy(congTy)
                .chiNhanhs(chiNhanhs)
                .build();
    }

    public List<CompanyAdminMeResponse.ThongTinChiNhanh> getBranches(AppUserPrinciple principal) {
        Integer userId = principal.getUserId().intValue();
        return accessService.getAccessibleBranches(userId).stream()
                .map(branch -> CompanyAdminMeResponse.ThongTinChiNhanh.builder()
                        .chiNhanhId(branch.getId() == null ? null : branch.getId().longValue())
                        .chiNhanhTen(branch.getTen())
                        .congTyId(branch.getCongTy() == null || branch.getCongTy().getId() == null
                                ? null
                                : branch.getCongTy().getId().longValue())
                        .congTyTen(branch.getCongTy() == null ? null : branch.getCongTy().getTen())
                        .vaiTroCongTy(resolveRoleForBranch(userId, branch))
                        .laTruSoChinh(branch.getLaTruSoChinh())
                        .trangThai(branch.getNgayXoa() == null ? "ACTIVE" : "DELETED")
                        .build())
                .toList();
    }

    public CompanyAdminMeResponse.ThongTinCongTy updateLogo(AppUserPrinciple principal, UpdateCompanyLogoRequest request) {
        CongTy congTy = resolveManagedCompany(principal.getUserId().intValue());

        String safeLogoUrl = request == null ? null : request.getLogoUrl();
        if (!StringUtils.hasText(safeLogoUrl)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "logoUrl không hợp lệ");
        }

        congTy.setLogoUrl(safeLogoUrl.trim());
        return mapCompanyResponse(companyRepository.save(congTy));
    }

    public CompanyAdminMeResponse.ThongTinCongTy updateCompanyInfo(AppUserPrinciple principal, UpdateCompanyInfoRequest request) {
        CongTy congTy = resolveManagedCompany(principal.getUserId().intValue());
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dữ liệu cập nhật không hợp lệ");
        }

        if (StringUtils.hasText(request.getTenCongTy())) {
            congTy.setTen(request.getTenCongTy().trim());
        }
        if (StringUtils.hasText(request.getMaSoThue())) {
            congTy.setMaSoThue(request.getMaSoThue().trim());
        }
        String safeWebsite = request.getWebsite();
        congTy.setWebsite(StringUtils.hasText(safeWebsite) ? safeWebsite.trim() : null);
        if (request.getMoTaCongTy() != null) {
            congTy.setMoTa(trimToNull(request.getMoTaCongTy()));
        }

        return mapCompanyResponse(companyRepository.save(congTy));
    }

    public CompanyAdminMeResponse.ThongTinCongTy resubmitCompany(AppUserPrinciple principal) {
        CongTy congTy = resolveManagedCompany(principal.getUserId().intValue());
        if (!"REJECTED".equalsIgnoreCase(congTy.getTrangThai())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ công ty bị từ chối mới có thể gửi duyệt lại");
        }

        congTy.setTrangThai("PENDING");
        congTy.setLyDoTuChoi(null);
        return mapCompanyResponse(companyRepository.save(congTy));
    }

    public CongTy resolveManagedCompany(Integer userId) {
        List<ThanhVienCongTy> memberships = accessService.getActiveMemberships(userId);
        if (memberships.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Người dùng không thuộc công ty nào");
        }
        ChiNhanhCongTy firstBranch = memberships.getFirst().getChiNhanh();
        if (firstBranch == null || firstBranch.getCongTy() == null || firstBranch.getCongTy().getId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không xác định được công ty quản lý");
        }
        return companyRepository.findById(firstBranch.getCongTy().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy công ty"));
    }

    public CongTy resolveApprovedManagedCompany(Integer userId) {
        CongTy congTy = resolveManagedCompany(userId);
        if (!"APPROVED".equalsIgnoreCase(congTy.getTrangThai())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, COMPANY_NOT_APPROVED_MESSAGE);
        }
        return congTy;
    }

    private List<CompanyAdminMeResponse.ThongTinChiNhanh> listOwnerBranches(ThanhVienCongTy firstMembership) {
        Integer companyId = firstMembership.getChiNhanh().getCongTy().getId();
        return companyBranchRepository.findByCongTy_Id(companyId).stream()
                .map(branch -> CompanyAdminMeResponse.ThongTinChiNhanh.builder()
                        .chiNhanhId(branch.getId() == null ? null : branch.getId().longValue())
                        .chiNhanhTen(branch.getTen())
                        .congTyId(branch.getCongTy() == null || branch.getCongTy().getId() == null
                                ? null
                                : branch.getCongTy().getId().longValue())
                        .congTyTen(branch.getCongTy() == null ? null : branch.getCongTy().getTen())
                        .vaiTroCongTy(EmployerCompanyRole.OWNER.name())
                        .laTruSoChinh(branch.getLaTruSoChinh())
                        .trangThai(branch.getNgayXoa() == null ? "ACTIVE" : "DELETED")
                        .build())
                .toList();
    }

    private CompanyAdminMeResponse.ThongTinChiNhanh mapBranchMembership(ThanhVienCongTy membership) {
        ChiNhanhCongTy branch = membership.getChiNhanh();
        return CompanyAdminMeResponse.ThongTinChiNhanh.builder()
                .chiNhanhId(branch.getId() == null ? null : branch.getId().longValue())
                .chiNhanhTen(branch.getTen())
                .congTyId(branch.getCongTy() == null || branch.getCongTy().getId() == null
                        ? null
                        : branch.getCongTy().getId().longValue())
                .congTyTen(branch.getCongTy() == null ? null : branch.getCongTy().getTen())
                .vaiTroCongTy(membership.getVaiTroCongTy() == null ? null : membership.getVaiTroCongTy().getTen())
                .laTruSoChinh(branch.getLaTruSoChinh())
                .trangThai(membership.getTrangThai())
                .build();
    }

    private String resolveRoleForBranch(Integer userId, ChiNhanhCongTy branch) {
        if (isCompanyOwner(userId, branch == null || branch.getCongTy() == null ? null : branch.getCongTy().getId())) {
            return EmployerCompanyRole.OWNER.name();
        }
        return accessService.getActiveMemberships(userId).stream()
                .filter(membership -> membership.getChiNhanh() != null
                        && membership.getChiNhanh().getId() != null
                        && branch.getId() != null
                        && Objects.equals(membership.getChiNhanh().getId(), branch.getId()))
                .map(membership -> membership.getVaiTroCongTy() == null ? null : membership.getVaiTroCongTy().getTen())
                .filter(StringUtils::hasText)
                .findFirst()
                .orElse(branch.getLaTruSoChinh() ? EmployerCompanyRole.OWNER.name() : EmployerCompanyRole.HR.name());
    }

    private boolean isOwnerMembership(ThanhVienCongTy membership) {
        return membership != null
                && membership.getVaiTroCongTy() != null
                && EmployerCompanyRole.OWNER.name().equalsIgnoreCase(membership.getVaiTroCongTy().getTen());
    }

    private boolean isCompanyOwner(Integer userId, Integer companyId) {
        if (userId == null || companyId == null) {
            return false;
        }
        return accessService.getActiveMemberships(userId).stream()
                .filter(this::isOwnerMembership)
                .anyMatch(membership -> membership.getChiNhanh() != null
                        && membership.getChiNhanh().getCongTy() != null
                        && companyId.equals(membership.getChiNhanh().getCongTy().getId()));
    }

    private CompanyAdminMeResponse.ThongTinCongTy mapCompanyResponse(CongTy congTy) {
        DangKyGoiCongTy activePostingPackage = packageService.resolveActivePostingPackage(congTy).orElse(null);
        return CompanyAdminMeResponse.ThongTinCongTy.builder()
                .id(congTy.getId() == null ? null : congTy.getId().longValue())
                .ten(congTy.getTen())
                .maSoThue(congTy.getMaSoThue())
                .website(congTy.getWebsite())
                .moTa(congTy.getMoTa())
                .logoUrl(congTy.getLogoUrl())
                .trangThai(congTy.getTrangThai())
                .lyDoTuChoi(congTy.getLyDoTuChoi())
                .coQuyenDangBai(activePostingPackage != null)
                .goiDangBaiTen(activePostingPackage == null || activePostingPackage.getDanhMucGoi() == null
                        ? null
                        : activePostingPackage.getDanhMucGoi().getTenGoi())
                .goiDangBaiHetHanLuc(activePostingPackage == null ? null : activePostingPackage.getHetHanLuc())
                .goiDangBaiTrangThai(activePostingPackage == null ? null : activePostingPackage.getTrangThai())
                .goiDangBaiTrangThaiThanhToan(activePostingPackage == null ? null : activePostingPackage.getTrangThaiThanhToan())
                .build();
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}

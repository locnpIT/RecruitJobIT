package com.phuocloc.projectfinal.recruit.company.service;

import com.phuocloc.projectfinal.recruit.company.repository.EmployerProfileRepository;
import com.phuocloc.projectfinal.recruit.company.repository.CompanyBranchRepository;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ChiNhanhCongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.ThanhVienCongTy;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CompanyAdminAccessService {

    private static final String COMPANY_NOT_APPROVED_MESSAGE = "Công ty chưa được duyệt, chỉ có thể cập nhật logo";
    private static final String OWNER_ROLE = "OWNER";

    private final EmployerProfileRepository employerProfileRepository;
    private final CompanyBranchRepository companyBranchRepository;

    /**
     * Lấy tất cả membership công ty của một user, đồng thời loại bỏ membership không còn hoạt động.
     * Đây là nền cho hầu hết kiểm tra quyền của khu vực company-admin.
     */
    @Transactional(readOnly = true)
    public List<ThanhVienCongTy> getActiveMemberships(Integer userId) {
        List<ThanhVienCongTy> memberships = employerProfileRepository.findByNguoiDung_IdAndNgayXoaIsNull(userId);
        return memberships.stream()
                .filter(this::isActiveMembership)
                .collect(Collectors.toList());
    }

    /**
     * Trả về danh sách chi nhánh người dùng được phép thao tác.
     * Nếu là OWNER, hệ thống mở rộng quyền ra toàn bộ chi nhánh thuộc cùng công ty.
     */
    @Transactional(readOnly = true)
    public List<ChiNhanhCongTy> getAccessibleBranches(Integer userId) {
        List<ThanhVienCongTy> memberships = getActiveMemberships(userId);
        if (memberships.stream().anyMatch(this::isOwnerMembership)) {
            ThanhVienCongTy ownerMembership = memberships.stream()
                    .filter(this::isOwnerMembership)
                    .findFirst()
                    .orElse(null);
            if (ownerMembership != null
                    && ownerMembership.getChiNhanh() != null
                    && ownerMembership.getChiNhanh().getCongTy() != null
                    && ownerMembership.getChiNhanh().getCongTy().getId() != null) {
                return companyBranchRepository.findByCongTy_Id(ownerMembership.getChiNhanh().getCongTy().getId());
            }
        }

        return memberships.stream()
                .map(ThanhVienCongTy::getChiNhanh)
                .filter(branch -> branch != null && branch.getId() != null)
                .collect(Collectors.toMap(
                        ChiNhanhCongTy::getId,
                        branch -> branch,
                        (left, right) -> left,
                        LinkedHashMap::new
                ))
                .values()
                .stream()
                .collect(Collectors.toList());
    }

    /**
     * Kiểm tra người dùng có membership hợp lệ trên một chi nhánh cụ thể hay không,
     * đồng thời xác minh:
     * - công ty đã được duyệt
     * - vai trò công ty có thuộc nhóm được phép thao tác hay không
     */
    @Transactional(readOnly = true)
    public ThanhVienCongTy requireMembership(Integer userId, Integer branchId, Collection<String> allowedRoles) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Thiếu thông tin người dùng đăng nhập");
        }
        if (branchId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần truyền chiNhanhId");
        }

        ThanhVienCongTy membership = employerProfileRepository
                .findByNguoiDung_IdAndChiNhanh_IdAndNgayXoaIsNull(userId, branchId)
                .filter(this::isActiveMembership)
                .orElseGet(() -> resolveOwnerAccess(userId, branchId));

        if (membership == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập chi nhánh này");
        }

        String companyStatus = membership.getChiNhanh().getCongTy().getTrangThai();
        if (!"APPROVED".equalsIgnoreCase(companyStatus)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, COMPANY_NOT_APPROVED_MESSAGE);
        }

        if (allowedRoles != null && !allowedRoles.isEmpty()) {
            String roleName = membership.getVaiTroCongTy() == null ? null : membership.getVaiTroCongTy().getTen();
            boolean allowed = allowedRoles.stream()
                    .filter(StringUtils::hasText)
                    .map(role -> role.toUpperCase(Locale.ROOT))
                    .anyMatch(role -> role.equalsIgnoreCase(roleName));
            if (!allowed) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Vai trò công ty không đủ quyền cho thao tác này"
                );
            }
        }

        return membership;
    }

    /**
     * Dùng khi chỉ cần chắc chắn user thuộc ít nhất một công ty nào đó,
     * ví dụ cho màn tổng quan hoặc lấy thông tin chung.
     */
    @Transactional(readOnly = true)
    public ThanhVienCongTy requireAnyMembership(Integer userId) {
        List<ThanhVienCongTy> memberships = getActiveMemberships(userId);
        if (memberships.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Người dùng không thuộc công ty nào");
        }
        return memberships.getFirst();
    }

    /**
     * Kiểm tra và trả về membership OWNER.
     * Các luồng nhạy cảm như quản lý gói hoặc HR thường bám vào helper này.
     */
    @Transactional(readOnly = true)
    public ThanhVienCongTy requireOwnerMembership(Integer userId) {
        return getActiveMemberships(userId).stream()
                .filter(this::isOwnerMembership)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ OWNER mới được quản lý gói công ty"));
    }

    /**
     * Resolve thực thể công ty gốc của OWNER hiện tại.
     */
    @Transactional(readOnly = true)
    public com.phuocloc.projectfinal.recruit.domain.congty.entity.CongTy resolveOwnerCompany(Integer userId) {
        ThanhVienCongTy ownerMembership = requireOwnerMembership(userId);
        return ownerMembership.getChiNhanh().getCongTy();
    }

    /**
     * Membership được xem là active khi:
     * - user còn hoạt động
     * - membership chưa bị xóa mềm
     * - membership trạng thái ACTIVE
     * - branch và company liên kết vẫn tồn tại
     */
    private boolean isActiveMembership(ThanhVienCongTy membership) {
        return membership != null
                && membership.getNguoiDung() != null
                && Boolean.TRUE.equals(membership.getNguoiDung().getDangHoatDong())
                && membership.getChiNhanh() != null
                && membership.getChiNhanh().getCongTy() != null
                && "ACTIVE".equalsIgnoreCase(membership.getTrangThai());
    }

    /**
     * OWNER là membership đặc biệt có thể được nâng quyền truy cập sang chi nhánh khác cùng công ty.
     */
    private boolean isOwnerMembership(ThanhVienCongTy membership) {
        return isActiveMembership(membership)
                && membership.getVaiTroCongTy() != null
                && OWNER_ROLE.equalsIgnoreCase(membership.getVaiTroCongTy().getTen());
    }

    /**
     * Trường hợp user là OWNER nhưng membership trực tiếp không nằm ở branch được yêu cầu,
     * hệ thống cho phép "mượn quyền" nếu branch đó vẫn thuộc cùng công ty.
     * Helper này dựng một membership ảo chỉ dùng cho bước kiểm tra truy cập hiện tại.
     */
    private ThanhVienCongTy resolveOwnerAccess(Integer userId, Integer branchId) {
        ThanhVienCongTy ownerMembership = getActiveMemberships(userId).stream()
                .filter(this::isOwnerMembership)
                .findFirst()
                .orElse(null);
        if (ownerMembership == null
                || ownerMembership.getChiNhanh() == null
                || ownerMembership.getChiNhanh().getCongTy() == null
                || ownerMembership.getChiNhanh().getCongTy().getId() == null) {
            return null;
        }

        ChiNhanhCongTy requestedBranch = companyBranchRepository.findById(branchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy chi nhánh"));

        Integer companyId = ownerMembership.getChiNhanh().getCongTy().getId();
        if (requestedBranch.getCongTy() == null
                || requestedBranch.getCongTy().getId() == null
                || !companyId.equals(requestedBranch.getCongTy().getId())) {
            return null;
        }

        ThanhVienCongTy grantedMembership = new ThanhVienCongTy();
        grantedMembership.setNguoiDung(ownerMembership.getNguoiDung());
        grantedMembership.setChiNhanh(requestedBranch);
        grantedMembership.setVaiTroCongTy(ownerMembership.getVaiTroCongTy());
        grantedMembership.setTrangThai(ownerMembership.getTrangThai());
        return grantedMembership;
    }
}

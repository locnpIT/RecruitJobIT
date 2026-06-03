package com.phuocloc.projectfinal.recruit.common.security.service;

import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service("companySecurityService")
/**
 * Helper phân quyền ở tầng Spring Security expression.
 *
 * <p>Service này thường được gọi từ `@PreAuthorize` để kiểm tra
 * vai trò công ty theo chi nhánh ngay trong controller layer.</p>
 */
public class CompanySecurityService {

    /**
     * Kiểm tra người dùng hiện tại có vai trò công ty role tại chi nhánh branchId hay không.
     * Hệ thống hiện chỉ dùng hai vai trò công ty: OWNER và HR.
     */
    public boolean hasRole(String requiredRole, Integer branchId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AppUserPrinciple)) {
            return false;
        }

        AppUserPrinciple principal = (AppUserPrinciple) authentication.getPrincipal();

        return principal.getCompanyMembers().stream()
                .filter(m -> branchId == null || m.getChiNhanhId().equals(branchId))
                .anyMatch(m -> isAuthorized(m.getVaiTroCongTy(), requiredRole));
    }

    private boolean isAuthorized(String userRole, String requiredRole) {
        if (userRole == null) return false;
        if (requiredRole == null || requiredRole.isEmpty()) return true;

        // Cấp bậc quyền: OWNER mạnh nhất, HR là vai trò thao tác chi nhánh.
        return switch (userRole) {
            case "OWNER" -> true; // OWNER làm được mọi thứ
            case "HR" -> "HR".equals(requiredRole); // HR chỉ làm được việc của HR
            default -> false;
        };
    }
}

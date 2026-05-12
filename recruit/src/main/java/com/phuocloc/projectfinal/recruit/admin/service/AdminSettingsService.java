package com.phuocloc.projectfinal.recruit.admin.service;

import com.phuocloc.projectfinal.recruit.admin.dto.request.UpdateAdminSettingsRequest;
import com.phuocloc.projectfinal.recruit.admin.dto.response.AdminSettingsResponse;
import java.util.concurrent.atomic.AtomicReference;
import org.springframework.stereotype.Service;

@Service
/**
 * Settings runtime cho khu vực admin.
 *
 * <p>Hiện service này chưa lưu DB mà giữ state trong memory bằng {@link AtomicReference}.
 * Mục tiêu là không thay đổi schema database nhưng vẫn có API settings để demo/điều hành.</p>
 */
public class AdminSettingsService {

    private final AtomicReference<AdminSettingsResponse> settingsRef = new AtomicReference<>(defaultSettings());

    public AdminSettingsResponse getSettings() {
        return settingsRef.get();
    }

    public AdminSettingsResponse updateSettings(UpdateAdminSettingsRequest request) {
        // Ghi đè toàn bộ read model settings hiện tại bằng dữ liệu mới từ frontend.
        AdminSettingsResponse next = AdminSettingsResponse.builder()
                .systemName(request.getSystemName())
                .timezone(request.getTimezone())
                .requireTaxCode(request.isRequireTaxCode())
                .requireLegalProof(request.isRequireLegalProof())
                .bannedKeywords(request.getBannedKeywords())
                .reviewSlaHours(request.getReviewSlaHours())
                .alertEmail(request.getAlertEmail())
                .dailyReportAlertThreshold(request.getDailyReportAlertThreshold())
                .adminTwoFactorEnabled(request.isAdminTwoFactorEnabled())
                .lockAfterFiveFailedAttempts(request.isLockAfterFiveFailedAttempts())
                .forcePasswordRotation90Days(request.isForcePasswordRotation90Days())
                .build();
        settingsRef.set(next);
        return next;
    }

    private AdminSettingsResponse defaultSettings() {
        return AdminSettingsResponse.builder()
                .systemName("Recruit Admin")
                .timezone("Asia/Ho_Chi_Minh")
                .requireTaxCode(true)
                .requireLegalProof(true)
                .bannedKeywords("lương thưởng không rõ ràng, đa cấp")
                .reviewSlaHours(24)
                .alertEmail("ops@recruit.vn")
                .dailyReportAlertThreshold(25)
                .adminTwoFactorEnabled(true)
                .lockAfterFiveFailedAttempts(true)
                .forcePasswordRotation90Days(false)
                .build();
    }
}

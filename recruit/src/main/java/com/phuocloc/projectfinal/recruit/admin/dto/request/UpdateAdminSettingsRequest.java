package com.phuocloc.projectfinal.recruit.admin.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO nhận dữ liệu đầu vào từ client cho API UpdateAdminSettingsRequest.
 * Chỉ chứa dữ liệu trao đổi, không chứa nghiệp vụ xử lý.
 */
@Getter
@Setter
public class UpdateAdminSettingsRequest {

    @NotBlank
    private String systemName;

    @NotBlank
    private String timezone;

    private boolean requireTaxCode;
    private boolean requireLegalProof;

    @NotBlank
    private String bannedKeywords;

    @Min(1)
    private int reviewSlaHours;

    @NotBlank
    private String alertEmail;

    @Min(1)
    private int dailyReportAlertThreshold;

    private boolean adminTwoFactorEnabled;
    private boolean lockAfterFiveFailedAttempts;
    private boolean forcePasswordRotation90Days;
}

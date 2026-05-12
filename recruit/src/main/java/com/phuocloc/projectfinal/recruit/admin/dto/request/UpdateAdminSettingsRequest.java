package com.phuocloc.projectfinal.recruit.admin.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

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

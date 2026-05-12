package com.phuocloc.projectfinal.recruit.admin.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminSettingsResponse {

    private String systemName;
    private String timezone;

    private boolean requireTaxCode;
    private boolean requireLegalProof;

    private String bannedKeywords;
    private int reviewSlaHours;

    private String alertEmail;
    private int dailyReportAlertThreshold;

    private boolean adminTwoFactorEnabled;
    private boolean lockAfterFiveFailedAttempts;
    private boolean forcePasswordRotation90Days;
}

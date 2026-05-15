package com.phuocloc.projectfinal.recruit.infrastructure.sepay;

import com.phuocloc.projectfinal.recruit.company.repository.DangKyGoiCongTyRepository;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.DangKyGoiCongTy;
import com.phuocloc.projectfinal.recruit.domain.congty.entity.DanhMucGoi;
import com.phuocloc.projectfinal.recruit.notification.service.NotificationService;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class SepayWebhookService {

    private static final Pattern DIGITS_PATTERN = Pattern.compile("(\\d+)");

    private final DangKyGoiCongTyRepository dangKyGoiCongTyRepository;
    private final SepayProperties sepayProperties;
    private final NotificationService notificationService;

    public void verifyWebhookSecret(String providedSecret, String authorizationHeader) {
        String expectedSecret = trimToNull(sepayProperties.getWebhookSecretKey());
        if (!StringUtils.hasText(expectedSecret)) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Webhook secret chưa được cấu hình");
        }

        String receivedSecret = resolveProvidedSecret(providedSecret, authorizationHeader);
        if (!StringUtils.hasText(receivedSecret) || !expectedSecret.equals(receivedSecret)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Webhook secret không hợp lệ");
        }
    }

    private String resolveProvidedSecret(String xSecretKey, String authorizationHeader) {
        String secretFromHeader = trimToNull(xSecretKey);
        if (StringUtils.hasText(secretFromHeader)) {
            return secretFromHeader;
        }

        String auth = trimToNull(authorizationHeader);
        if (!StringUtils.hasText(auth)) {
            return null;
        }

        String normalized = auth.trim();
        if (normalized.regionMatches(true, 0, "Apikey ", 0, "Apikey ".length())) {
            return trimToNull(normalized.substring("Apikey ".length()));
        }

        return null;
    }

    @Transactional
    public DangKyGoiCongTy handleWebhook(SepayWebhookRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Webhook payload không hợp lệ");
        }

        if (!"in".equalsIgnoreCase(request.getTransferType())) {
            return null; // bỏ qua tiền ra
        }

        Integer registrationId = extractRegistrationId(request);
        DangKyGoiCongTy registration = dangKyGoiCongTyRepository.findById(registrationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đăng ký gói"));

        if (isAlreadyPaid(registration)) {
            return registration;
        }

        verifyAmount(request, registration);

        LocalDateTime now = LocalDateTime.now();
        int soNgayHieuLuc = resolvePackageDurationDays(registration.getDanhMucGoi());
        LocalDateTime start = resolveStartTime(registration, now);

        registration.setTrangThaiThanhToan("PAID");
        registration.setTrangThai("ACTIVE");
        registration.setBatDauLuc(start);
        registration.setHetHanLuc(start.plusDays(soNgayHieuLuc));
        DangKyGoiCongTy saved = dangKyGoiCongTyRepository.save(registration);
        notificationService.createForUser(
                saved.getCongTy() == null ? null : saved.getCongTy().getChuCongTy(),
                "Thanh toán gói thành công",
                "Gói công ty đã được kích hoạt thành công.",
                "/company-admin/packages"
        );
        return saved;
    }

    private Integer extractRegistrationId(SepayWebhookRequest request) {
        if (StringUtils.hasText(request.getCode())) {
            return extractRegistrationIdFromText(request.getCode().trim());
        }

        String candidate = firstText(
                request.getContent(),
                request.getReferenceCode(),
                request.getDescription()
        );

        if (!StringUtils.hasText(candidate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không xác định được mã đăng ký gói");
        }

        String codePrefix = sepayProperties.getPaymentCodePrefix();
        if (StringUtils.hasText(codePrefix)) {
            Pattern prefixedPattern = Pattern.compile("(?i)" + Pattern.quote(codePrefix.trim()) + "(\\d+)");
            Matcher prefixedMatcher = prefixedPattern.matcher(candidate);
            if (prefixedMatcher.find()) {
                return Integer.parseInt(prefixedMatcher.group(1));
            }
        }

        return extractRegistrationIdFromText(candidate);
    }

    private Integer extractRegistrationIdFromText(String candidate) {
        Matcher matcher = DIGITS_PATTERN.matcher(candidate);
        if (!matcher.find()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không tìm thấy ID đăng ký trong nội dung thanh toán");
        }

        try {
            return Integer.parseInt(matcher.group(1));
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID đăng ký không hợp lệ", ex);
        }
    }

    private void verifyAmount(SepayWebhookRequest request, DangKyGoiCongTy registration) {
        if (request.getTransferAmount() == null || registration.getGiaTaiThoiDiemDangKy() == null) {
            return;
        }

        long paidAmount = request.getTransferAmount();
        long expectedAmount = Math.round(registration.getGiaTaiThoiDiemDangKy());

        if (paidAmount < expectedAmount) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số tiền thanh toán không khớp");
        }
    }

    private boolean isAlreadyPaid(DangKyGoiCongTy registration) {
        String paymentStatus = registration.getTrangThaiThanhToan();
        if (!StringUtils.hasText(paymentStatus)) {
            return false;
        }

        return "PAID".equalsIgnoreCase(paymentStatus)
                || "SUCCESS".equalsIgnoreCase(paymentStatus)
                || "COMPLETED".equalsIgnoreCase(paymentStatus)
                || "DONE".equalsIgnoreCase(paymentStatus);
    }

    private int resolvePackageDurationDays(DanhMucGoi packagePlan) {
        if (packagePlan == null || !StringUtils.hasText(packagePlan.getMaGoi())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không xác định được thời hạn gói");
        }

        Matcher matcher = DIGITS_PATTERN.matcher(packagePlan.getMaGoi());
        if (!matcher.find()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã gói không chứa số ngày hiệu lực");
        }

        try {
            return Integer.parseInt(matcher.group(1));
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số ngày hiệu lực của gói không hợp lệ", ex);
        }
    }

    private String firstText(String... values) {
        if (values == null) {
            return null;
        }

        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value.trim();
            }
        }

        return null;
    }

    private LocalDateTime resolveStartTime(DangKyGoiCongTy targetRegistration, LocalDateTime now) {
        if (targetRegistration == null
                || targetRegistration.getCongTy() == null
                || targetRegistration.getCongTy().getId() == null) {
            return now;
        }

        return dangKyGoiCongTyRepository.findByCongTy_IdOrderByNgayTaoDesc(targetRegistration.getCongTy().getId()).stream()
                .filter(registration -> registration != null && !registration.getId().equals(targetRegistration.getId()))
                .filter(this::isAlreadyPaid)
                .filter(registration -> "ACTIVE".equalsIgnoreCase(trimToEmpty(registration.getTrangThai())))
                .map(DangKyGoiCongTy::getHetHanLuc)
                .filter(end -> end != null && end.isAfter(now))
                .max(LocalDateTime::compareTo)
                .orElse(now);
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}

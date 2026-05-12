package com.phuocloc.projectfinal.recruit.infrastructure.sepay;

import java.net.URLEncoder;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
@RequiredArgsConstructor
public class SepayPaymentService {

    private static final DateTimeFormatter PAYMENT_CODE_TIME_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final List<String> SIGNED_FIELDS = List.of(
            "order_amount",
            "merchant",
            "currency",
            "operation",
            "order_description",
            "order_invoice_number",
            "customer_id",
            "payment_method",
            "success_url",
            "error_url",
            "cancel_url"
    );

    private final SepayProperties sepayProperties;

    public String generatePaymentCode() {
        String timestamp = LocalDateTime.now().format(PAYMENT_CODE_TIME_FORMAT);
        String suffix = randomAlphaNumeric(6);
        return sepayProperties.getPaymentCodePrefix() + timestamp + suffix;
    }

    public String buildPaymentCodeForRegistration(Integer registrationId) {
        if (registrationId == null || registrationId <= 0) {
            throw new IllegalArgumentException("Registration ID không hợp lệ");
        }
        return (sepayProperties.getPaymentCodePrefix() == null ? "" : sepayProperties.getPaymentCodePrefix())
                + registrationId;
    }

    public SepayCheckoutForm buildCheckoutForm(
            long amount,
            String orderInvoiceNumber,
            String orderDescription,
            String customerId
    ) {
        validateCheckoutConfig();

        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("order_amount", String.valueOf(amount));
        fields.put("merchant", sepayProperties.getMerchantId().trim());
        fields.put("currency", sepayProperties.getCheckoutCurrency().trim());
        fields.put("operation", sepayProperties.getCheckoutOperation().trim());
        fields.put("order_description", orderDescription);
        fields.put("order_invoice_number", orderInvoiceNumber);

        if (StringUtils.hasText(customerId)) {
            fields.put("customer_id", customerId.trim());
        }
        if (StringUtils.hasText(sepayProperties.getCheckoutPaymentMethod())) {
            fields.put("payment_method", sepayProperties.getCheckoutPaymentMethod().trim());
        }

        fields.put("success_url", sepayProperties.getCheckoutSuccessUrl().trim());
        fields.put("error_url", sepayProperties.getCheckoutErrorUrl().trim());
        fields.put("cancel_url", sepayProperties.getCheckoutCancelUrl().trim());
        fields.put("signature", createSignature(fields, resolveMerchantSecretKey()));

        return SepayCheckoutForm.builder()
                .actionUrl(sepayProperties.getCheckoutInitUrl().trim())
                .fields(fields)
                .build();
    }

    public String buildQrImageUrl(long amount, String paymentCode) {
        String encodedContent = URLEncoder.encode(buildTransferContent(paymentCode), StandardCharsets.UTF_8);
        return sepayProperties.getQrImageBaseUrl()
                + "?acc=" + encodeQueryValue(sepayProperties.getBankAccountNumber())
                + "&bank=" + encodeQueryValue(sepayProperties.getBankShortName())
                + "&amount=" + amount
                + "&des=" + encodedContent;
    }

    public String buildTransferContent(String paymentCode) {
        if (!StringUtils.hasText(paymentCode)) {
            throw new IllegalArgumentException("Payment code không được để trống");
        }
        return normalizePaymentCode(paymentCode);
    }

    public String normalizePaymentCode(String paymentCode) {
        if (!StringUtils.hasText(paymentCode)) {
            throw new IllegalArgumentException("Payment code không được để trống");
        }
        return paymentCode.trim().toUpperCase();
    }

    private String randomAlphaNumeric(int length) {
        final String alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(alphabet.charAt(RANDOM.nextInt(alphabet.length())));
        }
        return sb.toString();
    }

    private String encodeQueryValue(String value) {
        if (value == null) {
            return "";
        }
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String createSignature(Map<String, String> fields, String secretKey) {
        StringBuilder signedString = new StringBuilder();
        for (String field : SIGNED_FIELDS) {
            String value = fields.get(field);
            if (value == null) {
                continue;
            }
            if (!signedString.isEmpty()) {
                signedString.append(",");
            }
            signedString.append(field).append("=").append(value);
        }

        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hmac = mac.doFinal(signedString.toString().getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hmac);
        } catch (NoSuchAlgorithmException | InvalidKeyException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không tạo được chữ ký SePay", ex);
        }
    }

    private void validateCheckoutConfig() {
        if (!StringUtils.hasText(sepayProperties.getMerchantId())
                || !StringUtils.hasText(resolveMerchantSecretKey())
                || !StringUtils.hasText(sepayProperties.getCheckoutInitUrl())
                || !StringUtils.hasText(sepayProperties.getCheckoutSuccessUrl())
                || !StringUtils.hasText(sepayProperties.getCheckoutErrorUrl())
                || !StringUtils.hasText(sepayProperties.getCheckoutCancelUrl())) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Thiếu cấu hình SePay checkout (merchant/secret/action/success/error/cancel)");
        }

        validatePublicUrl("APP_SEPAY_CHECKOUT_SUCCESS_URL", sepayProperties.getCheckoutSuccessUrl());
        validatePublicUrl("APP_SEPAY_CHECKOUT_ERROR_URL", sepayProperties.getCheckoutErrorUrl());
        validatePublicUrl("APP_SEPAY_CHECKOUT_CANCEL_URL", sepayProperties.getCheckoutCancelUrl());
    }

    private String resolveMerchantSecretKey() {
        if (StringUtils.hasText(sepayProperties.getMerchantSecretKey())) {
            return sepayProperties.getMerchantSecretKey().trim();
        }
        return sepayProperties.getWebhookSecretKey() == null ? "" : sepayProperties.getWebhookSecretKey().trim();
    }

    private void validatePublicUrl(String envName, String rawUrl) {
        String value = rawUrl == null ? "" : rawUrl.trim();
        if (value.contains("<") || value.contains(">")) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, envName + " đang là placeholder, cần URL thật");
        }
        try {
            URI uri = URI.create(value);
            String scheme = uri.getScheme();
            String host = uri.getHost();
            if (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme)) {
                throw new IllegalArgumentException("invalid scheme");
            }
            if (!StringUtils.hasText(host) || "localhost".equalsIgnoreCase(host) || host.startsWith("127.")) {
                throw new IllegalArgumentException("local host not allowed");
            }
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, envName + " không hợp lệ: " + value);
        }
    }
}

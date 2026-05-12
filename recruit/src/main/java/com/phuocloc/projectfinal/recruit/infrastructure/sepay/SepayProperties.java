package com.phuocloc.projectfinal.recruit.infrastructure.sepay;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.sepay")
public class SepayProperties {

    private String merchantId;
    private String merchantSecretKey;

    private String bankShortName;

    private String bankAccountNumber;

    private String paymentCodePrefix = "GOI";

    private String webhookSecretKey;

    private String webhookUrl;

    private String qrImageBaseUrl = "https://qr.sepay.vn/img";

    private String checkoutInitUrl = "https://pay-sandbox.sepay.vn/v1/checkout/init";

    private String checkoutCurrency = "VND";

    private String checkoutOperation = "PURCHASE";

    private String checkoutSuccessUrl;

    private String checkoutErrorUrl;

    private String checkoutCancelUrl;

    private String checkoutPaymentMethod;
}

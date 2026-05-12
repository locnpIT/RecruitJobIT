package com.phuocloc.projectfinal.recruit.infrastructure.sepay;

import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments/sepay")
@RequiredArgsConstructor
/**
 * Webhook endpoint nhận callback thanh toán từ SePay.
 *
 * <p>Đây là entry-point production để SePay bắn giao dịch về backend sau khi người dùng chuyển khoản.</p>
 */
public class SepayWebhookController {

    private final SepayWebhookService sepayWebhookService;

    @PostMapping("/webhook")
    // Nhận payload giao dịch từ SePay, xác thực secret header rồi chuyển cho service xử lý nghiệp vụ.
    // Nếu service xử lý xong thành công thì trả 200 để SePay không retry lại webhook.
    public ResponseEntity<Map<String, Boolean>> handleWebhook(
            @RequestBody SepayWebhookRequest request,
            @RequestHeader(value = "X-Secret-Key", required = false) String xSecretKey,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        sepayWebhookService.verifyWebhookSecret(xSecretKey, authorization);
        sepayWebhookService.handleWebhook(request);
        return ResponseEntity.ok(Map.of("success", true));
    }
}

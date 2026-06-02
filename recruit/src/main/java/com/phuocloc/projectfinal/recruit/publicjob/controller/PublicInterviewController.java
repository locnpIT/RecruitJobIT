package com.phuocloc.projectfinal.recruit.publicjob.controller;

import com.phuocloc.projectfinal.recruit.publicjob.service.PublicInterviewResponseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public/interview")
@RequiredArgsConstructor
public class PublicInterviewController {

    private final PublicInterviewResponseService interviewResponseService;

    @GetMapping(value = "/respond", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> respond(
            @RequestParam String token,
            @RequestParam String action
    ) {
        var result = interviewResponseService.respond(token, action);
        String title = "CONFIRM".equalsIgnoreCase(action) ? "Đã xác nhận phỏng vấn" : "Đã từ chối phỏng vấn";
        String description = "CONFIRM".equalsIgnoreCase(action)
                ? "Bạn đã xác nhận tham gia phỏng vấn thành công."
                : "Bạn đã từ chối lời mời phỏng vấn thành công.";

        String html = """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>%s</title>
                </head>
                <body style="font-family:Arial,Helvetica,sans-serif;background:#f6f7fb;color:#1f2937;margin:0;padding:32px;">
                    <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;">
                        <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;">%s</h1>
                        <p style="margin:0 0 10px;font-size:15px;line-height:1.7;">%s</p>
                        <p style="margin:0;font-size:13px;color:#6b7280;">Mã đơn: #%s</p>
                    </div>
                </body>
                </html>
                """.formatted(title, title, description, result.applicationId());
        return ResponseEntity.ok(html);
    }
}

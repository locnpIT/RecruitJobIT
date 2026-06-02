package com.phuocloc.projectfinal.recruit.infrastructure.mail;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Async;
import org.springframework.util.StringUtils;
import java.util.LinkedHashMap;
import java.util.Map;
import com.phuocloc.projectfinal.recruit.auth.service.JwtService;

@Slf4j
@Service
@RequiredArgsConstructor
public class HrCredentialMailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final MailProperties mailProperties;
    private final PublicUrlProperties publicUrlProperties;
    private final JwtService jwtService;

    /**
     * Gửi mật khẩu khởi tạo cho HR sau khi owner tạo tài khoản mới.
     *
     * <p>Nếu cấu hình mail bị tắt hoặc thiếu biến môi trường, service sẽ fallback sang log
     * để flow tạo tài khoản không bị gãy.</p>
     */
    @Async("mailTaskExecutor")
    public void sendInitialPassword(
            String toEmail,
            String firstName,
            String lastName,
            String companyName,
            String password
    ) {
        if (!mailProperties.isEnabled()) {
            log.info(
                    "[HR-CREDENTIALS][MAIL_DISABLED] to={}, fullName={} {}, company={}, password={}",
                    toEmail,
                    lastName,
                    firstName,
                    companyName,
                    password
            );
            return;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("[HR-CREDENTIALS][MAIL_NOT_CONFIGURED] Missing JavaMailSender bean, fallback to log-only.");
            log.info(
                    "[HR-CREDENTIALS] to={}, fullName={} {}, company={}, password={}",
                    toEmail,
                    lastName,
                    firstName,
                    companyName,
                    password
            );
            return;
        }

        String fromEmail = resolveFromEmail();
        String subject = "Thông tin tài khoản HR của bạn";
        String fullName = buildFullName(firstName, lastName);
        String body = renderTemplate(fullName, companyName, toEmail, password);

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false, "UTF-8");
            helper.setTo(toEmail);
            helper.setFrom(fromEmail);
            helper.setSubject(subject);
            helper.setText(body, true);
            mailSender.send(mimeMessage);

            log.info("[HR-CREDENTIALS][SENT] to={}, company={}", toEmail, companyName);
        } catch (MessagingException | MailException ex) {
            log.error("[HR-CREDENTIALS][FAILED] to={}, company={}, reason={}", toEmail, companyName, ex.getMessage(), ex);
            // Không làm gãy luồng tạo tài khoản HR nếu mail thất bại.
        }
    }

    @Async("mailTaskExecutor")
    public void sendInterviewInvitation(
            Long applicationId,
            String toEmail,
            String firstName,
            String lastName,
            String companyName,
            String jobTitle,
            String interviewDateTime,
            String interviewLocation,
            String note,
            String branchAddress
    ) {
        if (!mailProperties.isEnabled()) {
            log.info(
                    "[INTERVIEW-INVITE][MAIL_DISABLED] applicationId={}, to={}, fullName={} {}, company={}, jobTitle={}, interviewDateTime={}, interviewLocation={}, note={}, branchAddress={}",
                    applicationId,
                    toEmail,
                    lastName,
                    firstName,
                    companyName,
                    jobTitle,
                    interviewDateTime,
                    interviewLocation,
                    note,
                    branchAddress
            );
            return;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("[INTERVIEW-INVITE][MAIL_NOT_CONFIGURED] Missing JavaMailSender bean, fallback to log-only.");
            log.info(
                    "[INTERVIEW-INVITE] applicationId={}, to={}, fullName={} {}, company={}, jobTitle={}, interviewDateTime={}, interviewLocation={}, note={}, branchAddress={}",
                    applicationId,
                    toEmail,
                    lastName,
                    firstName,
                    companyName,
                    jobTitle,
                    interviewDateTime,
                    interviewLocation,
                    note,
                    branchAddress
            );
            return;
        }

        String fromEmail = resolveFromEmail();
        String subject = "Thư mời phỏng vấn - " + safeText(jobTitle);
        String fullName = buildFullName(firstName, lastName);
        String confirmUrl = buildPublicResponseUrl(applicationId, "confirm");
        String declineUrl = buildPublicResponseUrl(applicationId, "decline");
        String body = renderInterviewTemplate(
                fullName,
                companyName,
                toEmail,
                jobTitle,
                interviewDateTime,
                interviewLocation,
                note,
                branchAddress,
                confirmUrl,
                declineUrl
        );

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false, "UTF-8");
            helper.setTo(toEmail);
            helper.setFrom(fromEmail);
            helper.setSubject(subject);
            helper.setText(body, true);
            mailSender.send(mimeMessage);

            log.info("[INTERVIEW-INVITE][SENT] to={}, company={}, jobTitle={}", toEmail, companyName, jobTitle);
        } catch (MessagingException | MailException ex) {
            log.error("[INTERVIEW-INVITE][FAILED] to={}, company={}, reason={}", toEmail, companyName, ex.getMessage(), ex);
        }
    }

    private String resolveFromEmail() {
        if (StringUtils.hasText(mailProperties.getFromEmail())) {
            return mailProperties.getFromEmail().trim();
        }
        if (StringUtils.hasText(mailProperties.getUsername())) {
            return mailProperties.getUsername().trim();
        }
        throw new IllegalStateException("Thiếu cấu hình app.mail.from-email hoặc app.mail.username");
    }

    private String buildFullName(String firstName, String lastName) {
        StringBuilder builder = new StringBuilder();
        if (StringUtils.hasText(lastName)) {
            builder.append(lastName.trim());
        }
        if (StringUtils.hasText(firstName)) {
            if (builder.length() > 0) {
                builder.append(' ');
            }
            builder.append(firstName.trim());
        }
        return builder.length() > 0 ? builder.toString() : "bạn";
    }

    private String buildBody(String fullName, String companyName, String email, String password) {
        return """
                Chào %s,

                Tài khoản HR của bạn đã được tạo thành công cho công ty: %s.

                Thông tin đăng nhập:
                - Email: %s
                - Mật khẩu tạm thời: %s

                Vui lòng đăng nhập và đổi mật khẩu sau lần đăng nhập đầu tiên.
                """.formatted(fullName, companyName, email, password);
    }

    private String renderTemplate(String fullName, String companyName, String email, String password) {
        try {
            ClassPathResource resource = new ClassPathResource("mail/hr-credentials.html");
            String template = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            return template
                    .replace("${fullName}", escapeHtml(fullName))
                    .replace("${companyName}", escapeHtml(companyName))
                    .replace("${email}", escapeHtml(email))
                    .replace("${password}", escapeHtml(password));
        } catch (IOException ex) {
            log.warn("[HR-CREDENTIALS][TEMPLATE_FALLBACK] Cannot load HTML template, using plain text body.");
            return buildBody(fullName, companyName, email, password).replace("\n", "<br>");
        }
    }

    private String renderInterviewTemplate(
            String fullName,
            String companyName,
            String email,
            String jobTitle,
            String interviewDateTime,
            String interviewLocation,
            String note,
            String branchAddress,
            String confirmUrl,
            String declineUrl
    ) {
        try {
            ClassPathResource resource = new ClassPathResource("mail/interview-invitation.html");
            String template = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            return template
                    .replace("${fullName}", escapeHtml(fullName))
                    .replace("${companyName}", escapeHtml(companyName))
                    .replace("${email}", escapeHtml(email))
                    .replace("${jobTitle}", escapeHtml(jobTitle))
                    .replace("${interviewDateTime}", escapeHtml(interviewDateTime))
                    .replace("${interviewLocation}", escapeHtml(interviewLocation))
                    .replace("${branchAddress}", escapeHtml(StringUtils.hasText(branchAddress) ? branchAddress : "Chưa cập nhật"))
                    .replace("${note}", escapeHtml(StringUtils.hasText(note) ? note : "Không có ghi chú thêm."))
                    .replace("${confirmUrl}", escapeHtml(confirmUrl))
                    .replace("${declineUrl}", escapeHtml(declineUrl));
        } catch (IOException ex) {
            log.warn("[INTERVIEW-INVITE][TEMPLATE_FALLBACK] Cannot load HTML template, using plain text body.");
            return buildInterviewBody(fullName, companyName, email, jobTitle, interviewDateTime, interviewLocation, note, branchAddress, confirmUrl, declineUrl).replace("\n", "<br>");
        }
    }

    private String escapeHtml(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private String buildInterviewBody(
            String fullName,
            String companyName,
            String email,
            String jobTitle,
            String interviewDateTime,
            String interviewLocation,
            String note,
            String branchAddress,
            String confirmUrl,
            String declineUrl
    ) {
        String safeNote = StringUtils.hasText(note) ? note : "Không có ghi chú thêm.";
        String safeBranchAddress = StringUtils.hasText(branchAddress) ? branchAddress : "Chưa cập nhật";
        return """
                Chào %s,

                Chúc mừng bạn đã được lựa chọn cho vòng phỏng vấn của đơn ứng tuyển: %s tại %s.

                Thông tin phỏng vấn:
                - Email: %s
                - Thời gian: %s
                - Địa điểm: %s
                - Địa chỉ chi nhánh: %s

                Ghi chú:
                %s

                Xác nhận: %s
                Từ chối: %s
                """.formatted(fullName, jobTitle, companyName, email, interviewDateTime, interviewLocation, safeBranchAddress, safeNote, confirmUrl, declineUrl);
    }

    private String safeText(String value) {
        return StringUtils.hasText(value) ? value.trim() : "Tin tuyển dụng";
    }

    private String buildPublicResponseUrl(Long applicationId, String action) {
        String baseUrl = StringUtils.hasText(publicUrlProperties.getBaseUrl())
                ? publicUrlProperties.getBaseUrl().trim()
                : "http://localhost:8080";
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("applicationId", applicationId);
        claims.put("action", action);
        String token = jwtService.generatePublicActionToken(claims, 7L * 24 * 60 * 60);
        return baseUrl + "/api/v1/public/interview/respond?token=" + token + "&action=" + action;
    }
}

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
     * <p>Nếu mail chưa sẵn sàng, chỉ ghi cảnh báo kỹ thuật và không log thông tin nhạy cảm.</p>
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
            log.warn("[HR-CREDENTIALS][MAIL_DISABLED] Mail disabled, credential email was not sent to {}", toEmail);
            return;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("[HR-CREDENTIALS][MAIL_NOT_CONFIGURED] Missing JavaMailSender bean, credential email was not sent to {}", toEmail);
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

    /**
     * Gửi mã OTP 6 số cho luồng quên mật khẩu.
     */
    @Async("mailTaskExecutor")
    public void sendForgotPasswordCode(
            String toEmail,
            String firstName,
            String lastName,
            String resetCode
    ) {
        String fullName = buildFullName(firstName, lastName);

        if (!mailProperties.isEnabled()) {
            log.info("[FORGOT-PASSWORD][MAIL_DISABLED] to={}, fullName={}, code={}", toEmail, fullName, resetCode);
            return;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("[FORGOT-PASSWORD][MAIL_NOT_CONFIGURED] Missing JavaMailSender bean, fallback to log-only.");
            log.info("[FORGOT-PASSWORD] to={}, fullName={}, code={}", toEmail, fullName, resetCode);
            return;
        }

        String fromEmail = resolveFromEmail();
        String subject = "Mã khôi phục mật khẩu";
        String body = renderForgotPasswordTemplate(fullName, toEmail, resetCode);

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false, "UTF-8");
            helper.setTo(toEmail);
            helper.setFrom(fromEmail);
            helper.setSubject(subject);
            helper.setText(body, true);
            mailSender.send(mimeMessage);
            log.info("[FORGOT-PASSWORD][SENT] to={}", toEmail);
        } catch (MessagingException | MailException ex) {
            log.error("[FORGOT-PASSWORD][FAILED] to={}, reason={}", toEmail, ex.getMessage(), ex);
        }
    }

    /**
     * Gửi mã xác nhận 6 số cho candidate.
     */
    @Async("mailTaskExecutor")
    public void sendCandidateEmailVerification(
            String toEmail,
            String firstName,
            String lastName,
            String verificationCode
    ) {
        String fullName = buildFullName(firstName, lastName);

        if (!mailProperties.isEnabled()) {
            log.info(
                    "[CANDIDATE-VERIFY][MAIL_DISABLED] to={}, fullName={}, code={}",
                    toEmail,
                    fullName,
                    verificationCode
            );
            return;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("[CANDIDATE-VERIFY][MAIL_NOT_CONFIGURED] Missing JavaMailSender bean, fallback to log-only.");
            log.info(
                    "[CANDIDATE-VERIFY] to={}, fullName={}, code={}",
                    toEmail,
                    fullName,
                    verificationCode
            );
            return;
        }

        String fromEmail = resolveFromEmail();
        String subject = "Xác nhận email tài khoản ứng viên";
        String body = renderCandidateVerificationTemplate(fullName, toEmail, verificationCode);

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false, "UTF-8");
            helper.setTo(toEmail);
            helper.setFrom(fromEmail);
            helper.setSubject(subject);
            helper.setText(body, true);
            mailSender.send(mimeMessage);

            log.info("[CANDIDATE-VERIFY][SENT] to={}", toEmail);
        } catch (MessagingException | MailException ex) {
            log.error("[CANDIDATE-VERIFY][FAILED] to={}, reason={}", toEmail, ex.getMessage(), ex);
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

    private String renderCandidateVerificationTemplate(String fullName, String email, String verificationCode) {
        try {
            ClassPathResource resource = new ClassPathResource("mail/candidate-email-verification.html");
            String template = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            return template
                    .replace("${fullName}", escapeHtml(fullName))
                    .replace("${email}", escapeHtml(email))
                    .replace("${verificationCode}", escapeHtml(verificationCode));
        } catch (IOException ex) {
            log.warn("[CANDIDATE-VERIFY][TEMPLATE_FALLBACK] Cannot load HTML template, using plain text body.");
            return buildCandidateVerificationBody(fullName, email, verificationCode).replace("\n", "<br>");
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

    private String buildCandidateVerificationBody(String fullName, String email, String verificationCode) {
        return """
                Chào %s,

                Tài khoản ứng viên của bạn đã được tạo với email: %s.

                Mã xác nhận của bạn là: %s
                Hãy nhập mã này trên màn hình xác nhận email để kích hoạt tài khoản.
                """.formatted(fullName, email, verificationCode);
    }

    private String renderForgotPasswordTemplate(String fullName, String email, String resetCode) {
        try {
            ClassPathResource resource = new ClassPathResource("mail/forgot-password.html");
            String template = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            return template
                    .replace("${fullName}", escapeHtml(fullName))
                    .replace("${email}", escapeHtml(email))
                    .replace("${resetCode}", escapeHtml(resetCode));
        } catch (IOException ex) {
            log.warn("[FORGOT-PASSWORD][TEMPLATE_FALLBACK] Cannot load HTML template, using plain text body.");
            return ("Chào " + fullName + ",\n\nMã khôi phục mật khẩu của bạn là: " + resetCode + "\nMã có hiệu lực trong 15 phút.").replace("\n", "<br>");
        }
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

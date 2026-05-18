package com.phuocloc.projectfinal.recruit.infrastructure.mail;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
/**
 * Service gửi thông tin tài khoản HR mới tạo.
 *
 * <p>Hiện tại đang chạy chế độ log-only để phục vụ môi trường dev.
 * Khi tích hợp SMTP/Brevo, phần log này sẽ được thay bằng gửi mail thật.</p>
 */
public class HrCredentialMailService {

    /**
     * Gửi mật khẩu khởi tạo cho HR sau khi owner tạo tài khoản mới.
     */
    public void sendInitialPassword(
            String toEmail,
            String firstName,
            String lastName,
            String companyName,
            String password
    ) {
        // TODO: Tich hop Brevo/SMTP thuc te. Hien tai log de de quan sat trong qua trinh dev.
        log.info(
                "[HR-CREDENTIALS] to={}, fullName={} {}, company={}, password={}",
                toEmail,
                lastName,
                firstName,
                companyName,
                password
        );
    }
}

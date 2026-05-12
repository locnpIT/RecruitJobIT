package com.phuocloc.projectfinal.recruit.infrastructure.mail;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class HrCredentialMailService {

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

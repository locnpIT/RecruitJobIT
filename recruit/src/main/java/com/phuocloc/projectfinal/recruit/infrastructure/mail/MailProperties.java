package com.phuocloc.projectfinal.recruit.infrastructure.mail;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.mail")
public class MailProperties {

    private boolean enabled;
    private String fromEmail;
    private String fromName;
    private String host;
    private Integer port;
    private String username;
    private String password;
    private SmtpProperties properties = new SmtpProperties();

    @Getter
    @Setter
    public static class SmtpProperties {
        private Smtp smtp = new Smtp();
    }

    @Getter
    @Setter
    public static class Smtp {
        private Boolean auth;
        private StartTls starttls = new StartTls();
        private Integer connectiontimeout;
        private Integer timeout;
        private Integer writetimeout;
    }

    @Getter
    @Setter
    public static class StartTls {
        private Boolean enable;
    }
}

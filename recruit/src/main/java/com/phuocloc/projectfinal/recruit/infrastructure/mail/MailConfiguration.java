package com.phuocloc.projectfinal.recruit.infrastructure.mail;

import java.util.Properties;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.core.task.TaskExecutor;

@Configuration
@EnableConfigurationProperties({MailProperties.class, PublicUrlProperties.class})
@RequiredArgsConstructor
public class MailConfiguration {

    private final MailProperties mailProperties;

    @Bean
    @ConditionalOnProperty(prefix = "app.mail", name = "enabled", havingValue = "true")
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(mailProperties.getHost());
        sender.setPort(defaultPort(mailProperties.getPort()));
        sender.setUsername(mailProperties.getUsername());
        sender.setPassword(mailProperties.getPassword());

        Properties props = sender.getJavaMailProperties();
        props.put("mail.smtp.auth", defaultBoolean(mailProperties.getProperties().getSmtp().getAuth(), true));
        props.put("mail.smtp.starttls.enable", defaultBoolean(mailProperties.getProperties().getSmtp().getStarttls().getEnable(), true));
        props.put("mail.smtp.connectiontimeout", defaultInt(mailProperties.getProperties().getSmtp().getConnectiontimeout(), 5000));
        props.put("mail.smtp.timeout", defaultInt(mailProperties.getProperties().getSmtp().getTimeout(), 5000));
        props.put("mail.smtp.writetimeout", defaultInt(mailProperties.getProperties().getSmtp().getWritetimeout(), 5000));
        props.put("mail.transport.protocol", "smtp");
        return sender;
    }

    @Bean(name = "mailTaskExecutor")
    public TaskExecutor mailTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("mail-");
        executor.initialize();
        return executor;
    }

    private int defaultPort(Integer port) {
        return port == null ? 587 : port;
    }

    private boolean defaultBoolean(Boolean value, boolean fallback) {
        return value == null ? fallback : value;
    }

    private int defaultInt(Integer value, int fallback) {
        return value == null ? fallback : value;
    }
}

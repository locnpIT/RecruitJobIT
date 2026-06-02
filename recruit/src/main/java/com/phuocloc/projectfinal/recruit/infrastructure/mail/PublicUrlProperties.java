package com.phuocloc.projectfinal.recruit.infrastructure.mail;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.public")
public class PublicUrlProperties {

    private String baseUrl;
}

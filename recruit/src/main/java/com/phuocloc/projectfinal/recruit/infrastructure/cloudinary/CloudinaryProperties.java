package com.phuocloc.projectfinal.recruit.infrastructure.cloudinary;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.cloudinary")
public class CloudinaryProperties {

    private String cloudName;
    private String apiKey;
    private String apiSecret;
    private String folder = "recruit/proofs";
    private String logoFolder = "recruit/company-logos";
}

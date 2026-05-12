package com.phuocloc.projectfinal.recruit.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Component
@Validated
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    /**
     * Khoá bí mật ở dạng Base64 dùng để ký và xác minh JWT.
     * Tách ra thành configuration property để có thể đổi theo từng môi trường
     * mà không phải sửa trực tiếp trong source code.
     */
    @NotBlank
    private String secretBase64;

    /**
     * Thời gian sống của access token tính theo giây.
     * Giá trị này được JwtService dùng khi phát hành token lúc đăng nhập.
     */
    private long accessTokenExpirationSeconds = 1000;
    
}

package com.phuocloc.projectfinal.recruit.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
public class AuthResponse {

    private UserInfo user;
    private TokenData token;


    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserInfo {
        private Long id;
        private String email;
        private String firstName;
        private String lastName;
        private String role;
        private Boolean isActive;
        private Boolean isLocked;

    }


    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TokenData {
        private String accessToken;
        private Long accessTokenExpiresIn;
    }


    
}

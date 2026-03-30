package com.phuocloc.projectfinal.recruit.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOwnerResponse {

    private OwnerInfo owner;
    private TokenData token;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OwnerInfo {
        private Long id;
        private String email;
        private String firstName;
        private String lastName;
        private String proofUrl;
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

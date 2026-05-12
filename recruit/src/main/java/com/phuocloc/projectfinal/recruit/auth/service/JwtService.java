package com.phuocloc.projectfinal.recruit.auth.service;

import java.time.Instant;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import com.phuocloc.projectfinal.recruit.auth.config.JwtProperties;
import com.phuocloc.projectfinal.recruit.auth.enums.RoleName;
import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
/**
 * Service thao tác JWT.
 *
 * <p>Chịu trách nhiệm sinh token, đọc claim và xác thực token hết hạn/hợp lệ.</p>
 */
public class JwtService {
    

    private final JwtProperties jwtProperties;
    private SecretKey signingKey;

    @PostConstruct
    void initSigningKey() {
        // Hỗ trợ cả secret base64 mới và secret raw cũ để tương thích môi trường legacy.
        String configuredSecret = jwtProperties.getSecretBase64();
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(configuredSecret);
        } catch (RuntimeException ex) {
            // Backward-compatible: accept raw secret from legacy .env
            keyBytes = configuredSecret.getBytes(StandardCharsets.UTF_8);
        }

        if (keyBytes.length < 32) {
            keyBytes = sha256(configuredSecret);
        }

        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateAccessToken(NguoiDung user) {
        // Claim tối thiểu gồm email, user id và role để backend có thể dựng principal lại từ token.
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(jwtProperties.getAccessTokenExpirationSeconds());


        return Jwts.builder()
                .subject(user.getEmail())
                .claim("uid", user.getId())
                .claim("role", user.getVaiTroHeThong().getTen())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(signingKey)
                .compact();
    }

    public String extractEmailFromToken(String token) {
        return parseClaims(token).getSubject();
    }

    public Long extractUserIdFromToken(String token) {
        Object uid = parseClaims(token).get("uid");
        if (uid instanceof Integer i)  return i.longValue();
        if (uid instanceof Long l) return l; 
        return Long.parseLong(String.valueOf(uid));
    }

    public RoleName extractRoleFromToken(String token) {
        String role = String.valueOf(parseClaims(token).get("role"));
        try {
            return RoleName.valueOf(role);
        } catch (IllegalArgumentException ex) {
            return RoleName.CANDIDATE;
        }
    }

    public boolean istokenValid(String token) {
        // Chỉ kiểm tra token parse được và chưa hết hạn.
        try {
            Claims claims = parseClaims(token);
            return claims.getExpiration() != null && claims.getExpiration().after(new Date());

        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    public long getAccessTokenExpiresIn() {
        return jwtProperties.getAccessTokenExpirationSeconds();
    }


    


    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private byte[] sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return digest.digest(value.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 algorithm is not available", ex);
        }
    }
}

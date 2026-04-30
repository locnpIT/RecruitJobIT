package com.phuocloc.projectfinal.recruit.auth.service;

import java.time.Instant;
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
public class JwtService {
    

    private final JwtProperties jwtProperties;
    private SecretKey signingKey;

    @PostConstruct
    void initSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtProperties.getSecretBase64());
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateAccessToken(NguoiDung user) {
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
        return RoleName.valueOf(role);
    }

    public boolean istokenValid(String token) {
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
    




}

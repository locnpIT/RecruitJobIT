package com.phuocloc.projectfinal.recruit.auth.security;

import java.util.Collection;
import java.util.List;

import org.jspecify.annotations.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.phuocloc.projectfinal.recruit.auth.enums.RoleName;
import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;

import com.phuocloc.projectfinal.recruit.auth.dto.shared.CompanyMemberInfo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Builder
public class AppUserPrinciple implements UserDetails {
    
    private final Long userId;
    private final String email;
    private final String passwordHash;
    private final Boolean active;
    private final RoleName role;
    private final List<CompanyMemberInfo> companyMembers;


    public static AppUserPrinciple fromUser(NguoiDung user, List<CompanyMemberInfo> companyMembers) {
        RoleName roleName = parseRoleName(user.getVaiTroHeThong() == null ? null : user.getVaiTroHeThong().getTen());
        return AppUserPrinciple.builder()
                .userId(user.getId().longValue())
                .email(user.getEmail())
                .passwordHash(user.getMatKhauBam())
                .active(user.getDangHoatDong())
                .role(roleName)
                .companyMembers(companyMembers != null ? companyMembers : List.of())
                .build();
    }

    public static AppUserPrinciple fromUser(NguoiDung user) {
        return fromUser(user, List.of());
    }

    private static RoleName parseRoleName(String rawRole) {
        if (rawRole == null) {
            return RoleName.CANDIDATE;
        }
        try {
            return RoleName.valueOf(rawRole.toUpperCase());
        } catch (IllegalArgumentException ex) {
            return RoleName.CANDIDATE;
        }
    }



    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }
    @Override
    public @Nullable String getPassword() {
        return passwordHash;
    }
    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return Boolean.TRUE.equals(active);
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }




}

package com.phuocloc.projectfinal.recruit.auth.security;

import java.util.Collection;
import java.util.List;

import org.jspecify.annotations.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.phuocloc.projectfinal.recruit.auth.enums.RoleName;
import com.phuocloc.projectfinal.recruit.domain.nguoidung.entity.NguoiDung;

import lombok.AllArgsConstructor;
import lombok.Getter;


@Getter
@AllArgsConstructor
public class AppUserPrinciple implements UserDetails {
    

    private final Long userId;
    private final String email;
    private final String passwordHash;
    private final Boolean active;
    private final RoleName role;


    public static AppUserPrinciple fromUser(NguoiDung user) {
        RoleName roleName = RoleName.valueOf(user.getVaiTroHeThong().getTen().toUpperCase());
        return new AppUserPrinciple(
                user.getId().longValue(),
                user.getEmail(),
                user.getMatKhauBam(),
                user.getDangHoatDong(),
                roleName
        );
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

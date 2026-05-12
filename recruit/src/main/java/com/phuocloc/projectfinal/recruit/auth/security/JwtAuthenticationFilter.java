package com.phuocloc.projectfinal.recruit.auth.security;

import java.io.IOException;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.phuocloc.projectfinal.recruit.auth.service.JwtService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
/**
 * Filter đọc JWT từ header Authorization và nạp principal vào SecurityContext.
 *
 * <p>Đây là mắt xích chính để backend nhận diện user hiện tại ở các route private.</p>
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {
   
    
    private final JwtService jwtService;
    private final AppUserDetailsService appUserDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        // Nếu request không có Bearer token thì bỏ qua và cho chain xử lý tiếp.
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        String token = authHeader.substring(7);

        // Chỉ dựng authentication nếu context hiện tại chưa có user và token còn hợp lệ.
        if (SecurityContextHolder.getContext().getAuthentication() == null && jwtService.istokenValid(token)) {
            AppUserPrinciple principle = resolvePrincipal(token);
            if (principle != null) {
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(principle, null, principle.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        filterChain.doFilter(request, response);



    }

    private AppUserPrinciple resolvePrincipal(String token) {
        try {
            // Luồng chuẩn: đọc email từ token rồi tải user đầy đủ từ database.
            String email = jwtService.extractEmailFromToken(token);
            UserDetails userDetails = appUserDetailsService.loadUserByUsername(email);
            if (userDetails instanceof AppUserPrinciple principle) {
                return principle;
            }
            return null;
        } catch (UsernameNotFoundException ex) {
            // Fallback: dùng trực tiếp claim trong token để tránh rơi 403 rỗng
            try {
                return AppUserPrinciple.builder()
                        .userId(jwtService.extractUserIdFromToken(token))
                        .email(jwtService.extractEmailFromToken(token))
                        .passwordHash("")
                        .active(true)
                        .role(jwtService.extractRoleFromToken(token))
                        .companyMembers(List.of())
                        .build();
            } catch (Exception ignored) {
                return null;
            }
        } catch (Exception ex) {
            return null;
        }
    }
    
    
}

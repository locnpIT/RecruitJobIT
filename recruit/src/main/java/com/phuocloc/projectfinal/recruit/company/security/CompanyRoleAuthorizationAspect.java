package com.phuocloc.projectfinal.recruit.company.security;

import com.phuocloc.projectfinal.recruit.auth.security.AppUserPrinciple;
import com.phuocloc.projectfinal.recruit.company.service.CompanyAdminAccessService;
import java.beans.PropertyDescriptor;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.core.DefaultParameterNameDiscoverer;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Aspect
@Component
@RequiredArgsConstructor
public class CompanyRoleAuthorizationAspect {

    private final CompanyAdminAccessService companyAdminAccessService;
    private final DefaultParameterNameDiscoverer parameterNameDiscoverer = new DefaultParameterNameDiscoverer();

    @Around("@annotation(hasCompanyRole)")
    public Object authorize(ProceedingJoinPoint joinPoint, HasCompanyRole hasCompanyRole) throws Throwable {
        AppUserPrinciple principal = getPrincipal();
        Integer userId = principal.getUserId().intValue();
        Integer branchId = resolveBranchId(joinPoint, hasCompanyRole.branchParam());
        Collection<String> allowedRoles = Arrays.stream(hasCompanyRole.value())
                .filter(StringUtils::hasText)
                .map(role -> role.toUpperCase(Locale.ROOT))
                .toList();

        companyAdminAccessService.requireMembership(userId, branchId, allowedRoles);
        return joinPoint.proceed();
    }

    private AppUserPrinciple getPrincipal() {
        Object authentication = SecurityContextHolder.getContext().getAuthentication() == null
                ? null
                : SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (authentication instanceof AppUserPrinciple principal) {
            return principal;
        }

        throw new ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Chưa đăng nhập");
    }

    private Integer resolveBranchId(ProceedingJoinPoint joinPoint, String branchParam) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String[] parameterNames = parameterNameDiscoverer.getParameterNames(signature.getMethod());
        Object[] args = joinPoint.getArgs();

        if (parameterNames != null) {
            for (int i = 0; i < parameterNames.length && i < args.length; i++) {
                if (parameterNames[i].equals(branchParam) || parameterNames[i].equalsIgnoreCase(branchParam)) {
                    Integer branchId = toInteger(args[i]);
                    if (branchId != null) {
                        return branchId;
                    }
                }
            }
        }

        for (Object arg : args) {
            Integer branchId = extractFromBean(arg, branchParam);
            if (branchId != null) {
                return branchId;
            }
        }

        return null;
    }

    private Integer extractFromBean(Object arg, String branchParam) {
        if (arg == null) {
            return null;
        }

        if (arg instanceof Integer integer) {
            return integer;
        }
        if (arg instanceof Long lng) {
            return lng.intValue();
        }

        try {
            PropertyDescriptor descriptor = new PropertyDescriptor(branchParam, arg.getClass());
            Object value = descriptor.getReadMethod().invoke(arg);
            return toInteger(value);
        } catch (Exception ignored) {
            return null;
        }
    }

    private Integer toInteger(Object value) {
        if (value instanceof Integer integer) {
            return integer;
        }
        if (value instanceof Long lng) {
            return lng.intValue();
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        return null;
    }
}

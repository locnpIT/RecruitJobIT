package com.phuocloc.projectfinal.recruit.common.security.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.security.access.prepost.PreAuthorize;

/**
 * Thành phần bảo mật phụ trách HasCompanyRole.
 * Hỗ trợ xác thực/ủy quyền theo quy tắc của hệ thống.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@PreAuthorize("@companySecurityService.hasRole(#role, #branchId)")
public @interface HasCompanyRole {
    String role() default "";
}

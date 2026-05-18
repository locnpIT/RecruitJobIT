package com.phuocloc.projectfinal.recruit.company.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Thành phần bảo mật phụ trách HasCompanyRole.
 * Hỗ trợ xác thực/ủy quyền theo quy tắc của hệ thống.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface HasCompanyRole {

    String[] value();

    String branchParam() default "chiNhanhId";
}

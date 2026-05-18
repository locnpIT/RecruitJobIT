package com.phuocloc.projectfinal.recruit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.EnableAspectJAutoProxy;


/**
 * Thành phần lõi RecruitApplication của hệ thống tuyển dụng.
 * Giữ vai trò hạ tầng/miền dùng chung giữa các module.
 */
@SpringBootApplication
@EnableAspectJAutoProxy
public class RecruitApplication {

	private static final Logger log = LoggerFactory.getLogger(RecruitApplication.class);

	public static void main(String[] args) {
		SpringApplication.run(RecruitApplication.class, args);
	}


}

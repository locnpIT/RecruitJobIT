package com.phuocloc.projectfinal.recruit.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.phuocloc.projectfinal.recruit.common.response.ApiResponse;

/**
 * Thành phần lõi GlobalExceptionHandler của hệ thống tuyển dụng.
 * Giữ vai trò hạ tầng/miền dùng chung giữa các module.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<String>> handleValidation(MethodArgumentNotValidException ex) {

        StringBuilder errors = new StringBuilder();

        ex.getBindingResult().getFieldErrors().forEach(err -> {
            errors.append(err.getField()).append(": ").append(err.getDefaultMessage()).append("; ");
        });

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(false, "Validation failed", errors.toString(), null));
    }

}

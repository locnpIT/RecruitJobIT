package com.phuocloc.projectfinal.recruit.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    private boolean success;
    private String code;
    private String message;
    private String path;
    private Instant timestamp;
    private List<ErrorDetail> errors;
    private int status;

    public ErrorResponse() {
        this.success = false;
        this.timestamp = Instant.now();
    }

    public ErrorResponse(HttpStatus status, String message, String path){
        this.success = false;
        this.status = status.value();
        this.message = message;
        this.path = path;
        this.timestamp = Instant.now();
    }

    public ErrorResponse(HttpStatus status, String code, String message, String path, List<ErrorDetail> errors) {
        this.success = false;
        this.status = status.value();
        this.code = code;
        this.message = message;
        this.path = path;
        this.errors = errors;
        this.timestamp = Instant.now();
    }
}

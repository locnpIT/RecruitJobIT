package com.phuocloc.projectfinal.recruit.common.response;

import lombok.Getter;
import lombok.Setter;
import org.springframework.http.HttpStatus;

@Getter
@Setter
public class SuccessResponse<T> {

    private int status;
    private boolean success;
    private String message;
    private T data;

    // Constructor mặc định: 200 OK
    public SuccessResponse(String message, T data) {
        this.status = HttpStatus.OK.value();
        this.success = true;
        this.message = message;
        this.data = data;
    }

    // Constructor với custom status (201 Created, 204 No Content, etc.)
    public SuccessResponse(HttpStatus status, String message, T data) {
        this.status = status.value();
        this.success = true;
        this.message = message;
        this.data = data;
    }

    // Constructor cho 204 No Content (không có data)
    public SuccessResponse() {
        this.status = HttpStatus.NO_CONTENT.value();
        this.success = true;
        this.message = "Operation successful";
        this.data = null;
    }
}

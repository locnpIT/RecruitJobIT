package com.phuocloc.projectfinal.recruit.company.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO nhận dữ liệu đầu vào từ client cho API UpdateApplicationStatusRequest.
 * Chỉ chứa dữ liệu trao đổi, không chứa nghiệp vụ xử lý.
 */
@Getter
@Setter
public class UpdateApplicationStatusRequest {

    /**
     * Trạng thái pipeline của đơn ứng tuyển.
     *
     * <p>Không tạo bảng/cột mới: giá trị này được lưu vào cột
     * {@code DonUngTuyen.trangThai} đang có sẵn.</p>
     */
    @NotBlank(message = "Trạng thái đơn ứng tuyển không được để trống")
    private String trangThai;
}

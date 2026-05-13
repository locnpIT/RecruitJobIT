package com.phuocloc.projectfinal.recruit.company.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

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

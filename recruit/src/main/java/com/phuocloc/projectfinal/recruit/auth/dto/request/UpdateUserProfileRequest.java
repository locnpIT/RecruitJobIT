package com.phuocloc.projectfinal.recruit.auth.dto.request;

import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO cập nhật thông tin cá nhân của user hiện tại.
 *
 * <p>Giữ đúng naming theo model NguoiDung để mapping và bảo trì dễ hơn.</p>
 */
@Getter
@Setter
public class UpdateUserProfileRequest {

    private String soDienThoai;
    private LocalDate ngaySinh;
    private String gioiTinh;
    private String diaChiChiTiet;
    private Long xaPhuongId;
}

package com.phuocloc.projectfinal.recruit.admin.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
/**
 * Payload cập nhật gói dịch vụ hiện có từ khu vực admin.
 *
 * <p>Về cấu trúc gần giống create request vì admin được phép sửa lại
 * các thông tin business chính của gói sau khi đã tạo.</p>
 */
public class UpdatePackageRequest {

    // Tên hiển thị mới của gói sau khi chỉnh sửa.
    @NotBlank(message = "Tên gói không được để trống")
    private String tenGoi;

    // Mô tả mới của gói trên giao diện quản trị và company-admin.
    private String moTa;

    // Giá niêm yết mới của gói.
    @NotNull(message = "Giá niêm yết không được để trống")
    @DecimalMin(value = "0.0", inclusive = true, message = "Giá niêm yết không hợp lệ")
    private BigDecimal giaNiemYet;

    // Số ngày hiệu lực mới sau khi cập nhật.
    @NotNull(message = "Số ngày hiệu lực không được để trống")
    @Min(value = 1, message = "Số ngày hiệu lực phải lớn hơn 0")
    private Integer soNgayHieuLuc;
}

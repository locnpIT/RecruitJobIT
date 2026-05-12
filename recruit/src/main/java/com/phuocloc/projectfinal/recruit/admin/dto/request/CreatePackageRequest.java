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
 * Payload tạo gói dịch vụ mới từ khu vực admin.
 *
 * <p>Request này là input cho màn /admin/plans khi admin thêm một gói mở bán mới
 * để doanh nghiệp có thể đăng ký ở khu vực company-admin/packages.</p>
 */
public class CreatePackageRequest {

    // Tên hiển thị của gói trên UI.
    @NotBlank(message = "Tên gói không được để trống")
    private String tenGoi;

    // Mô tả ngắn về quyền lợi hoặc đặc điểm nổi bật của gói.
    private String moTa;

    // Giá bán niêm yết của gói tại thời điểm tạo.
    @NotNull(message = "Giá niêm yết không được để trống")
    @DecimalMin(value = "0.0", inclusive = true, message = "Giá niêm yết không hợp lệ")
    private BigDecimal giaNiemYet;

    // Thời lượng hiệu lực của gói, tính theo số ngày.
    @NotNull(message = "Số ngày hiệu lực không được để trống")
    @Min(value = 1, message = "Số ngày hiệu lực phải lớn hơn 0")
    private Integer soNgayHieuLuc;
}

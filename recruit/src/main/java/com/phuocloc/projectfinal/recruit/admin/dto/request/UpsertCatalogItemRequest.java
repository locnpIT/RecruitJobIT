package com.phuocloc.projectfinal.recruit.admin.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload tạo/cập nhật một item danh mục hệ thống.
 *
 * <p>Dùng chung cho các bảng danh mục ở admin: vai trò hệ thống, vai trò công ty,
 * loại tài liệu và loại chứng chỉ.</p>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpsertCatalogItemRequest {

    @NotBlank(message = "Tên danh mục không được để trống")
    @Size(max = 255, message = "Tên danh mục không được vượt quá 255 ký tự")
    private String ten;

    @Size(max = 1000, message = "Mô tả không được vượt quá 1000 ký tự")
    private String moTa;
}

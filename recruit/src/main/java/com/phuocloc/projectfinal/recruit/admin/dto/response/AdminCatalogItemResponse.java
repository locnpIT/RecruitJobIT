package com.phuocloc.projectfinal.recruit.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO item danh mục trả về cho màn admin CRUD.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminCatalogItemResponse {
    private Long id;
    private String ten;
    private String moTa;
}

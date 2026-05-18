package com.phuocloc.projectfinal.recruit.domain.congty.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

/**
 * Entity ánh xạ dữ liệu cho ThanhVienCongTyId.
 * Dùng bởi JPA để đọc/ghi dữ liệu tương ứng trong cơ sở dữ liệu.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ThanhVienCongTyId implements Serializable {
    private Integer nguoiDung;
    private Integer chiNhanh;
}

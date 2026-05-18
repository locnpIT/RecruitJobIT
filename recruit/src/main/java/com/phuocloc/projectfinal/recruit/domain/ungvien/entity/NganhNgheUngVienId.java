package com.phuocloc.projectfinal.recruit.domain.ungvien.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

/**
 * Entity ánh xạ dữ liệu cho NganhNgheUngVienId.
 * Dùng bởi JPA để đọc/ghi dữ liệu tương ứng trong cơ sở dữ liệu.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NganhNgheUngVienId implements Serializable {
    private Integer hoSoUngVien;
    private Integer nganhNghe;
}

package com.phuocloc.projectfinal.recruit.domain.ungvien.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

/**
 * Entity ánh xạ dữ liệu cho KyNangUngVienId.
 * Dùng bởi JPA để đọc/ghi dữ liệu tương ứng trong cơ sở dữ liệu.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KyNangUngVienId implements Serializable {
    private Integer hoSoUngVien;
    private Integer kyNang;
}

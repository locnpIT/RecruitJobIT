package com.phuocloc.projectfinal.recruit.domain.tuyendung.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

/**
 * Entity ánh xạ dữ liệu cho NguoiDungTinTuyenDungId.
 * Dùng bởi JPA để đọc/ghi dữ liệu tương ứng trong cơ sở dữ liệu.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NguoiDungTinTuyenDungId implements Serializable {
    private Integer nguoiDung;
    private Integer tinTuyenDung;
}

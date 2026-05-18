package com.phuocloc.projectfinal.recruit.domain.tuyendung.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

/**
 * Entity ánh xạ dữ liệu cho KyNangTinTuyenDungId.
 * Dùng bởi JPA để đọc/ghi dữ liệu tương ứng trong cơ sở dữ liệu.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KyNangTinTuyenDungId implements Serializable {
    private Integer tinTuyenDung;
    private Integer kyNang;
}

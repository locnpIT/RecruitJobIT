package com.phuocloc.projectfinal.recruit.auth.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import lombok.Getter;
import lombok.Setter;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class CreateOwnerRequest {

    private static final long MAX_TEP_MINH_CHUNG_SIZE = 10L * 1024 * 1024;
    private static final Set<String> TEP_MINH_CHUNG_CONTENT_TYPES_HOP_LE = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/png"
    );

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    private String matKhau;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
    private String soDienThoai;

    @NotBlank(message = "Tên không được để trống")
    @Size(max = 100, message = "Tên không được vượt quá 100 ký tự")
    private String ten;

    @NotBlank(message = "Họ không được để trống")
    @Size(max = 100, message = "Họ không được vượt quá 100 ký tự")
    private String ho;

    @NotBlank(message = "Tên công ty không được để trống")
    @Size(max = 150, message = "Tên công ty không được vượt quá 150 ký tự")
    private String tenCongTy;

    @NotBlank(message = "Mã số thuế không được để trống")
    @Size(max = 50, message = "Mã số thuế không được vượt quá 50 ký tự")
    private String maSoThue;

    @Size(max = 255, message = "Website không được vượt quá 255 ký tự")
    private String website;

    @Size(max = 5000, message = "Mô tả công ty không được vượt quá 5000 ký tự")
    private String moTaCongTy;

    @NotEmpty(message = "Cần ít nhất một chi nhánh")
    @Valid
    private List<BranchRequest> chiNhanhs = new ArrayList<>();

    private MultipartFile tepMinhChung;

    @Size(max = 10000, message = "Đường dẫn minh chứng không được vượt quá 10000 ký tự")
    private String duongDanMinhChung;

    @AssertTrue(message = "Cần upload tepMinhChung hoặc cung cấp duongDanMinhChung")
    public boolean isMinhChungDuocCungCap() {
        return (tepMinhChung != null && !tepMinhChung.isEmpty()) || StringUtils.hasText(duongDanMinhChung);
    }

    @AssertTrue(message = "File minh chứng chỉ hỗ trợ PDF, JPG, PNG")
    public boolean isLoaiTepMinhChungHopLe() {
        if (tepMinhChung == null || tepMinhChung.isEmpty()) {
            return true;
        }
        String contentType = tepMinhChung.getContentType();
        return contentType != null && TEP_MINH_CHUNG_CONTENT_TYPES_HOP_LE.contains(contentType);
    }

    @AssertTrue(message = "File minh chứng tối đa 10MB")
    public boolean isKichThuocTepMinhChungHopLe() {
        if (tepMinhChung == null || tepMinhChung.isEmpty()) {
            return true;
        }
        return tepMinhChung.getSize() <= MAX_TEP_MINH_CHUNG_SIZE;
    }

    @Getter
    @Setter
    public static class BranchRequest {
        @NotBlank(message = "Tên chi nhánh không được để trống")
        @Size(max = 150, message = "Tên chi nhánh không được vượt quá 150 ký tự")
        private String tenChiNhanh;

        @NotBlank(message = "Địa chỉ chi nhánh không được để trống")
        @Size(max = 255, message = "Địa chỉ chi nhánh không được vượt quá 255 ký tự")
        private String diaChiChiTietChiNhanh;

        @Size(max = 255, message = "Tên phường/xã không được vượt quá 255 ký tự")
        private String tenXaPhuong;

        private Long tinhThanhId;

        private Long xaPhuongId;

        @NotNull(message = "Chi nhánh chính không được để trống")
        private Boolean laTruSoChinh;
    }
}

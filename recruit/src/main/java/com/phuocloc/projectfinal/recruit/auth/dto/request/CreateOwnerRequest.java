package com.phuocloc.projectfinal.recruit.auth.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Set;
import lombok.Getter;
import lombok.Setter;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class CreateOwnerRequest {

    private static final long MAX_PROOF_FILE_SIZE = 10L * 1024 * 1024;
    private static final Set<String> ALLOWED_PROOF_CONTENT_TYPES = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/png"
    );

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
    private String phoneNumber;

    @NotBlank(message = "Tên không được để trống")
    @Size(max = 100, message = "Tên không được vượt quá 100 ký tự")
    private String firstName;

    @NotBlank(message = "Họ không được để trống")
    @Size(max = 100, message = "Họ không được vượt quá 100 ký tự")
    private String lastName;

    private MultipartFile proofFile;

    @Size(max = 10000, message = "Đường dẫn minh chứng không được vượt quá 10000 ký tự")
    private String proofUrl;

    @AssertTrue(message = "Cần upload file minh chứng hoặc cung cấp proofUrl")
    public boolean isProofProvided() {
        return (proofFile != null && !proofFile.isEmpty()) || StringUtils.hasText(proofUrl);
    }

    @AssertTrue(message = "File minh chứng chỉ hỗ trợ PDF, JPG, PNG")
    public boolean isProofFileTypeValid() {
        if (proofFile == null || proofFile.isEmpty()) {
            return true;
        }
        String contentType = proofFile.getContentType();
        return contentType != null && ALLOWED_PROOF_CONTENT_TYPES.contains(contentType);
    }

    @AssertTrue(message = "File minh chứng tối đa 10MB")
    public boolean isProofFileSizeValid() {
        if (proofFile == null || proofFile.isEmpty()) {
            return true;
        }
        return proofFile.getSize() <= MAX_PROOF_FILE_SIZE;
    }
}

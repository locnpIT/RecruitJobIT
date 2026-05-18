package com.phuocloc.projectfinal.recruit.infrastructure.cloudinary;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import java.io.IOException;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Slf4j
/**
 * Service trung gian làm việc với Cloudinary.
 *
 * <p>Gồm 2 nhóm nghiệp vụ:
 * cấp chữ ký upload an toàn cho frontend và upload file proof trực tiếp từ backend
 * cho các luồng cần server-side upload.</p>
 */
public class CloudinaryStorageService {

    private final Cloudinary cloudinary;
    private final CloudinaryProperties properties;

    /**
     * Mặc định tạo chữ ký cho mục đích upload minh chứng (`proof`).
     */
    public Map<String, Object> generateSignature() {
        return generateSignature("proof");
    }

    /**
     * Tạo chữ ký Cloudinary theo purpose (`proof` hoặc `logo`) để frontend upload trực tiếp.
     */
    public Map<String, Object> generateSignature(String purpose) {
        long timestamp = System.currentTimeMillis() / 1000;
        Map<String, Object> params = new java.util.HashMap<>();
        params.put("folder", resolveFolder(purpose));
        params.put("timestamp", timestamp);

        try {
            String signature = cloudinary.apiSignRequest(params, properties.getApiSecret());
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("signature", signature);
            response.put("timestamp", timestamp);
            response.put("cloud_name", properties.getCloudName());
            response.put("api_key", properties.getApiKey());
            response.put("folder", resolveFolder(purpose));
            return response;
        } catch (Exception e) {
            log.error("Error generating Cloudinary signature", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể tạo chữ ký upload");
        }
    }

    /**
     * Upload file minh chứng từ backend lên Cloudinary và trả về `secure_url`.
     */
    public String uploadProof(MultipartFile file) {
        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", properties.getFolder(),
                            "overwrite", true
                    )
            );

            Object secureUrl = result.get("secure_url");
            if (secureUrl == null) {
                log.error("Cloudinary upload failed: secure_url is null");
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Upload file thất bại");
            }
            return secureUrl.toString();
        } catch (IOException ex) {
            log.error("Cloudinary upload error: ", ex);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể upload file", ex);
        }
    }

    private String resolveFolder(String purpose) {
        if ("logo".equalsIgnoreCase(purpose)) {
            return properties.getLogoFolder();
        }
        return properties.getFolder();
    }
}

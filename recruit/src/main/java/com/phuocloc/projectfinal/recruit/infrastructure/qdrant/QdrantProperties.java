package com.phuocloc.projectfinal.recruit.infrastructure.qdrant;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Cấu hình kết nối Qdrant cho semantic index.
 * Mặc định để disabled để không ảnh hưởng môi trường local chưa cài Qdrant.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.qdrant")
public class QdrantProperties {

    // Bật/tắt toàn bộ luồng semantic index mà không cần sửa code.
    private boolean enabled = false;
    // Endpoint REST của Qdrant, ví dụ: http://localhost:6333 hoặc cluster URL.
    private String url = "http://localhost:6333";
    // API key (nếu Qdrant deployment yêu cầu auth).
    private String apiKey;
    // Timeout cho mỗi request gọi Qdrant.
    private int timeoutMillis = 5000;
    // Kích thước vector phải đồng nhất giữa mọi collection.
    private int vectorSize = 384;
    // Tên collection lưu embedding hồ sơ ứng viên.
    private String khoHoSoUngVien = "chi_muc_nhung_ho_so_ung_vien";
    // Tên collection lưu embedding đơn ứng tuyển.
    private String khoDonUngTuyen = "chi_muc_nhung_don_ung_tuyen";
    // Tên collection lưu embedding tin tuyển dụng.
    private String khoTinTuyenDung = "chi_muc_nhung_tin_tuyen_dung";
}

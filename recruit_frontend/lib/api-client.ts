import axios from "axios";
import { clearAdminSession, getJwtExpiryMs } from "@/lib/admin-session";

// HTTP client dùng chung cho toàn bộ frontend.
// Mặc định trỏ về backend local và tự gắn Bearer token từ localStorage cho API private.
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor gắn JWT cho API private.
// Chỉ đọc localStorage ở browser; trong SSR không có window/localStorage.
apiClient.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const token = localStorage.getItem("token");
  if (token) {
    const expiresAt = getJwtExpiryMs(token);
    // Token hết hạn nhưng user vẫn còn trong localStorage là nguyên nhân phổ biến gây 403.
    // Dọn session để UI quay về trạng thái chưa đăng nhập thay vì tiếp tục gọi API private.
    if (expiresAt !== null && expiresAt <= Date.now()) {
      clearAdminSession();
      return config;
    }

    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;

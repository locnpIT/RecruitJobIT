import axios from "axios";

// HTTP client dùng chung cho toàn bộ frontend.
// Mặc định trỏ về backend local và tự gắn Bearer token từ localStorage cho API private.
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Thêm interceptor để xử lý token sau này
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;

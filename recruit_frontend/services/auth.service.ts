import apiClient from "@/lib/api-client";
import axios from "axios";

// Service tập trung các API xác thực và tiện ích upload file lên Cloudinary.
// Được dùng bởi login/register/profile/avatar/company proof/candidate proof.
export interface CloudinarySignatureData {
  api_key: string;
  timestamp: number;
  signature: string;
  folder: string;
  cloud_name: string;
}

export interface LoginPayload {
  email: string;
  matKhau: string;
}

export interface AuthSessionResponse {
  nguoiDung: {
    id: number;
    email: string;
    ten: string | null;
    ho: string | null;
    soDienThoai?: string | null;
    vaiTro: string;
    dangHoatDong: boolean;
    anhDaiDienUrl?: string | null;
  };
  phienDangNhap: {
    accessToken: string;
    thoiHanTokenGiay: number;
  };
}

export interface UserProfileResponse {
  id: number;
  email: string;
  ten: string | null;
  ho: string | null;
  soDienThoai: string | null;
  vaiTro: string;
  dangHoatDong: boolean;
  anhDaiDienUrl: string | null;
}

export interface RegisterCandidatePayload {
  email: string;
  matKhau: string;
  soDienThoai: string;
  ten: string;
  ho: string;
}

export interface RegisterOwnerPayload extends RegisterCandidatePayload {
  tenCongTy: string;
  maSoThue: string;
  website?: string;
  moTaCongTy?: string;
  chiNhanhs: Array<{
    tenChiNhanh: string;
    diaChiChiTietChiNhanh: string;
    tinhThanhId: number;
    tenXaPhuong: string;
    laTruSoChinh: boolean;
  }>;
  duongDanMinhChung: string;
}

export const authService = {
  getCloudinarySignature: async (purpose = "proof"): Promise<CloudinarySignatureData> => {
    const response = await apiClient.get("/auth/cloudinary-signature", {
      params: { purpose },
    });
    return response.data.data;
  },

  uploadToCloudinary: async (file: File, signatureData: CloudinarySignatureData): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signatureData.api_key);
    formData.append("timestamp", signatureData.timestamp);
    formData.append("signature", signatureData.signature);
    formData.append("folder", signatureData.folder);

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${signatureData.cloud_name}/auto/upload`,
      formData
    );
    return response.data.secure_url;
  },

  login: async (data: LoginPayload) => {
    const response = await apiClient.post("/auth/login", data);
    return response.data.data as AuthSessionResponse;
  },

  getMe: async () => {
    const response = await apiClient.get("/auth/me");
    return response.data.data as UserProfileResponse;
  },

  updateAvatar: async (anhDaiDienUrl: string) => {
    const response = await apiClient.patch("/auth/me/avatar", { anhDaiDienUrl });
    return response.data.data as UserProfileResponse;
  },

  registerCandidate: async (data: RegisterCandidatePayload) => {
    const response = await apiClient.post("/auth/register", data);
    return response.data.data;
  },

  registerOwner: async (data: RegisterOwnerPayload) => {
    const response = await apiClient.post("/auth/register-owner", data);
    return response.data.data;
  },
};

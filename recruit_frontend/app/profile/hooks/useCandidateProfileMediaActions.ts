"use client";

import { useState, type ChangeEvent, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import { authService, type UserProfileResponse } from "@/services/auth/auth.service";
import type { LocalUser } from "./types";

type UseCandidateProfileMediaActionsParams = {
  setProfile: Dispatch<SetStateAction<UserProfileResponse | null>>;
};

export function useCandidateProfileMediaActions({ setProfile }: UseCandidateProfileMediaActionsParams) {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingEduProof, setUploadingEduProof] = useState(false);
  const [uploadingCertProof, setUploadingCertProof] = useState(false);

  const syncAvatarToLocalUser = (anhDaiDienUrl: string | null) => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      return;
    }
    const localUser = JSON.parse(raw) as LocalUser;
    localStorage.setItem("user", JSON.stringify({ ...localUser, anhDaiDienUrl }));
  };

  const handleSelectAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh.");
      return;
    }

    try {
      setUploadingAvatar(true);
      const signature = await authService.getCloudinarySignature("avatar");
      const uploadedUrl = await authService.uploadToCloudinary(file, signature);
      const updated = await authService.updateAvatar(uploadedUrl);
      setProfile(updated);
      syncAvatarToLocalUser(updated.anhDaiDienUrl);
      toast.success("Cập nhật ảnh đại diện thành công.");
    } catch {
      toast.error("Không thể cập nhật ảnh đại diện.");
    } finally {
      setUploadingAvatar(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const uploadProofToCloudinary = async (file: File) => {
    const signature = await authService.getCloudinarySignature("proof");
    return authService.uploadToCloudinary(file, signature);
  };

  const uploadEducationProof = async (file: File) => {
    try {
      setUploadingEduProof(true);
      const uploadedUrl = await uploadProofToCloudinary(file);
      toast.success("Đã tải minh chứng học vấn.");
      return uploadedUrl;
    } catch {
      toast.error("Không thể tải minh chứng học vấn.");
      return "";
    } finally {
      setUploadingEduProof(false);
    }
  };

  const uploadCertificateProof = async (file: File) => {
    try {
      setUploadingCertProof(true);
      const uploadedUrl = await uploadProofToCloudinary(file);
      toast.success("Đã tải minh chứng chứng chỉ.");
      return uploadedUrl;
    } catch {
      toast.error("Không thể tải minh chứng chứng chỉ.");
      return "";
    } finally {
      setUploadingCertProof(false);
    }
  };

  return {
    uploadingAvatar,
    uploadingEduProof,
    uploadingCertProof,
    handleSelectAvatar,
    uploadEducationProof,
    uploadCertificateProof,
  };
}

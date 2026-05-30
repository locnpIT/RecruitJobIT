"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { getApiErrorMessage } from "@/lib/api-error";
import { authService } from "@/services/auth/auth.service";
import { companyAdminSettingsService } from "@/services/company-admin/settings.service";
import type {
  CompanyAdminMeResponse,
  CompanyProofType,
  CompanyProofUploadItemPayload,
} from "@/services/company-admin/types";
import type { CompanyInfoForm } from "../components/types";
import type { ProofRow } from "../components/types";

type UseCompanyAdminSettingsActionsOptions = {
  data: CompanyAdminMeResponse | null;
  form: CompanyInfoForm;
  setData: Dispatch<SetStateAction<CompanyAdminMeResponse | null>>;
  proofRows: ProofRow[];
  proofTypes: CompanyProofType[];
  resetProofRows: (defaultTypeId: number | null) => void;
};

// Dùng cho màn company-admin/settings: xử lý upload logo, upload minh chứng, resubmit.
export function useCompanyAdminSettingsActions({
  data,
  form,
  setData,
  proofRows,
  proofTypes,
  resetProofRows,
}: UseCompanyAdminSettingsActionsOptions) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingProofs, setIsSavingProofs] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoChange = (file: File | null) => {
    setLogoFile(file);

    if (!file) {
      setLogoPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadLogo = async () => {
    if (!logoFile) {
      throw new Error("Bạn chưa chọn file logo.");
    }

    setIsSaving(true);
    try {
      const signature = await authService.getCloudinarySignature("logo");
      const uploadedUrl = await authService.uploadToCloudinary(logoFile, signature);
      const updatedCompany = await companyAdminSettingsService.updateCompanyLogo(uploadedUrl);

      setData((current) =>
        current
          ? {
              ...current,
              congTy: {
                ...current.congTy,
                ...updatedCompany,
              },
            }
          : current
      );

      window.dispatchEvent(
        new CustomEvent("company-logo-updated", {
          detail: {
            logoUrl: updatedCompany.logoUrl,
            companyName: updatedCompany.ten,
          },
        })
      );

      setLogoFile(null);
      setLogoPreview(null);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Không thể cập nhật logo công ty."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadProofs = async () => {
    const validRows = proofRows.filter((row) => row.file && row.loaiTaiLieuId != null);
    if (validRows.length === 0) {
      throw new Error("Bạn chưa chọn đủ file và loại tài liệu.");
    }

    const invalidRow = proofRows.find((row) => row.file && row.loaiTaiLieuId == null);
    if (invalidRow) {
      throw new Error("Vui lòng chọn loại tài liệu cho tất cả file đã tải lên.");
    }

    setIsSavingProofs(true);
    try {
      const uploadedProofs: CompanyProofUploadItemPayload[] = [];
      for (const row of validRows) {
        const signature = await authService.getCloudinarySignature("proof");
        const uploadedUrl = await authService.uploadToCloudinary(row.file as File, signature);
        uploadedProofs.push({
          loaiTaiLieuId: row.loaiTaiLieuId as number,
          duongDanTep: uploadedUrl,
          tenTep: row.file?.name,
        });
      }

      const createdProofs = await companyAdminSettingsService.uploadCompanyProofs({
        minhChungs: uploadedProofs,
      });

      resetProofRows(proofTypes[0]?.id ?? null);
      return createdProofs.length;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Không thể tải lên minh chứng."));
    } finally {
      setIsSavingProofs(false);
    }
  };

  const handleResubmit = async () => {
    if (data?.congTy.trangThai?.toUpperCase() !== "REJECTED") {
      throw new Error("Chỉ công ty bị từ chối mới có thể gửi duyệt lại.");
    }

    if (!form.tenCongTy.trim()) {
      throw new Error("Tên công ty không được để trống.");
    }

    setIsResubmitting(true);
    try {
      const savedCompany = await companyAdminSettingsService.updateCompanyInfo({
        tenCongTy: form.tenCongTy.trim(),
        maSoThue: form.maSoThue.trim() || undefined,
        website: form.website.trim() || undefined,
        moTaCongTy: form.moTaCongTy.trim() || undefined,
      });

      setData((current) =>
        current
          ? {
              ...current,
              congTy: {
                ...current.congTy,
                ...savedCompany,
              },
            }
          : current
      );

      window.dispatchEvent(
        new CustomEvent("company-info-updated", {
          detail: {
            companyName: savedCompany.ten,
            companyStatus: savedCompany.trangThai,
          },
        })
      );

      const resubmittedCompany = await companyAdminSettingsService.resubmitCompany();
      setData((current) =>
        current
          ? {
              ...current,
              congTy: {
                ...current.congTy,
                ...resubmittedCompany,
              },
            }
          : current
      );

      window.dispatchEvent(
        new CustomEvent("company-status-updated", {
          detail: {
            companyStatus: resubmittedCompany.trangThai,
          },
        })
      );
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Không thể gửi duyệt lại công ty."));
    } finally {
      setIsResubmitting(false);
    }
  };

  return {
    isSaving,
    isSavingProofs,
    isResubmitting,
    logoFile,
    logoPreview,
    handleLogoChange,
    handleUploadLogo,
    handleUploadProofs,
    handleResubmit,
  };
}

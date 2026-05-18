"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { authService } from "@/services/auth.service";
import {
  companyAdminService,
  type CompanyAdminMeResponse,
  type CompanyProofType,
  type CompanyProofUploadItemPayload,
} from "@/services/company-admin.service";
import { isCompanyApproved } from "../company-admin-status";
import { CompanyAdminRestrictedNotice } from "../components/CompanyAdminRestrictedNotice";
import { CompanyInfoSection } from "./components/CompanyInfoSection";
import { CompanyLogoSection } from "./components/CompanyLogoSection";
import { SettingsPageHeader } from "./components/SettingsPageHeader";
import { CompanyProofsSection } from "./components/CompanyProofsSection";
import { CompanyResubmitSection } from "./components/CompanyResubmitSection";
import { useCompanyProofRows } from "./components/useCompanyProofRows";
import type { CompanyInfoForm } from "./components/types";

/**
 * Trang cấu hình công ty.
 * Đây là màn quan trọng nhất của luồng duyệt doanh nghiệp vì nó cho phép:
 * - cập nhật thông tin cơ bản
 * - cập nhật logo
 * - tải minh chứng pháp lý
 * - gửi duyệt lại nếu công ty bị từ chối
 */
const emptyForm: CompanyInfoForm = {
  tenCongTy: "",
  maSoThue: "",
  website: "",
  moTaCongTy: "",
};

export default function CompanyAdminSettingsPage() {
  const [data, setData] = useState<CompanyAdminMeResponse | null>(null);
  const [form, setForm] = useState<CompanyInfoForm>(emptyForm);
  const [proofTypes, setProofTypes] = useState<CompanyProofType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingProofs, setIsSavingProofs] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const { proofRows, addProofRow, removeProofRow, updateProofRow, resetProofRows, applyDefaultTypeToEmptyRows } =
    useCompanyProofRows();

  useEffect(() => {
    let active = true;

    companyAdminService
      .getMe()
      .then((response) => {
        if (!active) return;
        setData(response);
        setForm({
          tenCongTy: response.congTy.ten ?? "",
          maSoThue: response.congTy.maSoThue ?? "",
          website: response.congTy.website ?? "",
          moTaCongTy: response.congTy.moTa ?? "",
        });
      })
      .catch(() => {
        if (!active) return;
        setError("Không tải được thông tin công ty.");
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    companyAdminService
      .getCompanyProofTypes()
      .then((types) => {
        if (!active) return;
        setProofTypes(types);
        applyDefaultTypeToEmptyRows(types);
      })
      .catch(() => {
        if (!active) return;
        setProofTypes([]);
      });

    return () => {
      active = false;
    };
  }, [applyDefaultTypeToEmptyRows]);

  const companyApproved = isCompanyApproved(data?.congTy.trangThai);
  const companyRejected = data?.congTy.trangThai?.toUpperCase() === "REJECTED";
  const companyLogo = data?.congTy.logoUrl ?? null;

  /**
   * Chỉ tạo preview local cho logo, chưa upload ngay.
   * Upload thật chỉ xảy ra khi người dùng bấm nút cập nhật.
   */
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

  /**
   * Upload logo lên Cloudinary, sau đó lưu URL về backend.
   * Sau khi thành công sẽ phát custom event để sidebar shell cập nhật logo ngay.
   */
  const handleUploadLogo = async () => {
    if (!logoFile) {
      toast.error("Bạn chưa chọn file logo.");
      return;
    }

    setIsSaving(true);
    try {
      const signature = await authService.getCloudinarySignature("logo");
      const uploadedUrl = await authService.uploadToCloudinary(logoFile, signature);
      const updatedCompany = await companyAdminService.updateCompanyLogo(uploadedUrl);

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
      toast.success("Đã cập nhật logo công ty.");
    } catch {
      toast.error("Không thể cập nhật logo công ty.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadProofs = async () => {
    const validRows = proofRows.filter((row) => row.file && row.loaiTaiLieuId != null);
    if (validRows.length === 0) {
      toast.error("Bạn chưa chọn đủ file và loại tài liệu.");
      return;
    }

    const invalidRow = proofRows.find((row) => row.file && row.loaiTaiLieuId == null);
    if (invalidRow) {
      toast.error("Vui lòng chọn loại tài liệu cho tất cả file đã tải lên.");
      return;
    }

    setIsSavingProofs(true);
    try {
      const uploadedProofs: CompanyProofUploadItemPayload[] = [];
      for (const row of validRows) {
        // Minh chứng được upload từng file vì mỗi file cần một signature Cloudinary hợp lệ.
        const signature = await authService.getCloudinarySignature("proof");
        const uploadedUrl = await authService.uploadToCloudinary(row.file as File, signature);
        uploadedProofs.push({
          loaiTaiLieuId: row.loaiTaiLieuId as number,
          duongDanTep: uploadedUrl,
          tenTep: row.file?.name,
        });
      }

      const createdProofs = await companyAdminService.uploadCompanyProofs({
        minhChungs: uploadedProofs,
      });

      resetProofRows(proofTypes[0]?.id ?? null);
      toast.success(`Đã tải lên ${createdProofs.length} minh chứng.`);
    } catch {
      toast.error("Không thể tải lên minh chứng.");
    } finally {
      setIsSavingProofs(false);
    }
  };

  /**
   * Luồng gửi duyệt lại gồm 2 bước:
   * 1. lưu thông tin công ty mới nhất
   * 2. gọi endpoint resubmit để backend chuyển trạng thái quay lại chờ duyệt
   */
  const handleResubmit = async () => {
    if (!companyRejected) {
      toast.error("Chỉ công ty bị từ chối mới có thể gửi duyệt lại.");
      return;
    }

    if (!form.tenCongTy.trim()) {
      toast.error("Tên công ty không được để trống.");
      return;
    }

    const confirmed = window.confirm("Bạn muốn gửi hồ sơ công ty duyệt lại ngay bây giờ?");
    if (!confirmed) {
      return;
    }

    setIsResubmitting(true);
    try {
      const savedCompany = await companyAdminService.updateCompanyInfo({
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

      const resubmittedCompany = await companyAdminService.resubmitCompany();
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
      toast.success("Đã gửi duyệt lại công ty.");
    } catch {
      toast.error("Không thể gửi duyệt lại công ty.");
    } finally {
      setIsResubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Đang tải tuỳ chỉnh...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        {error ?? "Không có dữ liệu công ty."}
      </div>
    );
  }

  return (
    <div className="space-y-8 text-slate-900">
      <SettingsPageHeader companyName={data.congTy.ten ?? "Công ty chưa có tên"} />

      {!companyApproved ? (
        <CompanyAdminRestrictedNotice
          title={companyRejected ? "Hồ sơ công ty bị từ chối" : "Công ty đang chờ duyệt"}
          tone={companyRejected ? "danger" : "success"}
          description={
            companyRejected
              ? `Lý do từ chối: ${data.congTy.lyDoTuChoi ?? "Chưa có lý do"}`
              : "Công ty đang chờ duyệt. Bạn vẫn có thể cập nhật thông tin và logo."
          }
        />
      ) : null}

      <section className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <CompanyInfoSection form={form} onChange={setForm} />
          <CompanyProofsSection
            companyApproved={companyApproved}
            proofTypes={proofTypes}
            proofRows={proofRows}
            isSavingProofs={isSavingProofs}
            onAddRow={() => addProofRow(proofTypes[0]?.id ?? null)}
            onRemoveRow={(rowId) => removeProofRow(rowId, proofTypes[0]?.id ?? null)}
            onUpdateRow={updateProofRow}
            onUploadAll={() => void handleUploadProofs()}
          />
          <CompanyResubmitSection isResubmitting={isResubmitting} onResubmit={() => void handleResubmit()} />
        </div>

        <CompanyLogoSection
          companyLogo={companyLogo}
          logoPreview={logoPreview}
          isSaving={isSaving}
          onChangeFile={handleLogoChange}
          onUpload={() => void handleUploadLogo()}
        />
      </section>

    </div>
  );
}

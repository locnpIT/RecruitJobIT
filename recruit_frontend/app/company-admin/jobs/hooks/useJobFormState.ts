"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { getApiErrorMessage } from "@/lib/api-error";
import { authService } from "@/services/auth/auth.service";
import type { CompanyAdminBranch, CompanyAdminJob } from "@/services/company-admin/types";
import type { JobFormValues } from "../components/JobFormModal";

type UseJobFormStateOptions = {
  branches: CompanyAdminBranch[];
  selectedBranchId: number | null;
  setActionError: (msg: string) => void;
};

// Quản lý toàn bộ form state cho trang jobs: react-hook-form, watched values,
// reset helpers, upload CV template và chọn template từ job cũ.
export function useJobFormState({ branches, selectedBranchId, setActionError }: UseJobFormStateOptions) {
  const [isUploadingCvTemplate, setIsUploadingCvTemplate] = useState(false);
  const [cvTemplateFileName, setCvTemplateFileName] = useState<string | null>(null);

  const { control, register, handleSubmit, reset, setValue } = useForm<JobFormValues>({
    defaultValues: {
      batBuocCV: false,
      kyNangIds: [],
    },
  });

  const batBuocCV = useWatch({ control, name: "batBuocCV" });
  const mauCvUrlValue = useWatch({ control, name: "mauCvUrl" });
  const moTaValue = useWatch({ control, name: "moTa" }) ?? "";
  const yeuCauValue = useWatch({ control, name: "yeuCau" }) ?? "";
  const phucLoiValue = useWatch({ control, name: "phucLoi" }) ?? "";
  const selectedKyNangIds = useWatch({ control, name: "kyNangIds" }) ?? [];

  const chiNhanhField = register("chiNhanhId", { valueAsNumber: true });
  const batBuocCVField = register("batBuocCV", {
    onChange: (event) => {
      if (!event.target.checked) {
        setValue("mauCvUrl", "");
        setCvTemplateFileName(null);
      }
    },
  });

  const resetForCreate = () => {
    reset({
      chiNhanhId: selectedBranchId ?? branches[0]?.chiNhanhId ?? 0,
      tieuDe: "",
      nganhNgheId: 0,
      moTa: "",
      yeuCau: "",
      phucLoi: "",
      batBuocCV: false,
      mauCvUrl: "",
      loaiHinhLamViecId: 0,
      capDoKinhNghiemId: 0,
      luongToiThieu: undefined,
      luongToiDa: undefined,
      soLuongTuyen: 1,
      denHanLuc: "",
      kyNangIds: [],
    });
    setCvTemplateFileName(null);
  };

  const resetForEdit = (job: CompanyAdminJob) => {
    reset({
      chiNhanhId: job.chiNhanhId ?? selectedBranchId ?? 0,
      tieuDe: job.tieuDe ?? "",
      nganhNgheId: job.nganhNgheId ?? 0,
      moTa: job.moTa ?? "",
      yeuCau: job.yeuCau ?? "",
      phucLoi: job.phucLoi ?? "",
      batBuocCV: Boolean(job.batBuocCV),
      mauCvUrl: job.mauCvUrl ?? "",
      loaiHinhLamViecId: job.loaiHinhLamViecId ?? 0,
      capDoKinhNghiemId: job.capDoKinhNghiemId ?? 0,
      luongToiThieu: job.luongToiThieu ?? undefined,
      luongToiDa: job.luongToiDa ?? undefined,
      soLuongTuyen: job.soLuongTuyen ?? 1,
      denHanLuc: job.denHanLuc ? new Date(job.denHanLuc).toISOString().slice(0, 16) : "",
      kyNangIds: (job.kyNangs ?? [])
        .map((item) => Number(item.id ?? 0))
        .filter((id) => Number.isFinite(id) && id > 0),
    });
    setCvTemplateFileName(null);
  };

  const handleUploadCvTemplate = async (file: File | null) => {
    if (!file) {
      return;
    }
    setIsUploadingCvTemplate(true);
    setActionError("");
    try {
      const signature = await authService.getCloudinarySignature("proof");
      const uploadedUrl = await authService.uploadToCloudinary(file, signature);
      setValue("mauCvUrl", uploadedUrl, { shouldDirty: true });
      setCvTemplateFileName(file.name);
    } catch (uploadError) {
      setActionError(getApiErrorMessage(uploadError, "Không thể upload mẫu CV. Vui lòng thử lại."));
    } finally {
      setIsUploadingCvTemplate(false);
    }
  };

  const handleSelectTemplate = (job: CompanyAdminJob) => {
    setValue("moTa", job.moTa ?? "", { shouldDirty: true });
    setValue("yeuCau", job.yeuCau ?? "", { shouldDirty: true });
    setValue("phucLoi", job.phucLoi ?? "", { shouldDirty: true });
  };

  return {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    chiNhanhField,
    batBuocCVField,
    batBuocCV,
    mauCvUrlValue,
    moTaValue,
    yeuCauValue,
    phucLoiValue,
    selectedKyNangIds,
    isUploadingCvTemplate,
    cvTemplateFileName,
    resetForCreate,
    resetForEdit,
    handleUploadCvTemplate,
    handleSelectTemplate,
  };
}

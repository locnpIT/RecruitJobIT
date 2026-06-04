"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { useForm, useWatch } from "react-hook-form";
import { getApiErrorMessage } from "@/lib/api-error";
import { authService } from "@/services/auth/auth.service";
import { companyAdminJobsService } from "@/services/company-admin/jobs.service";
import type { CompanyAdminBranch, CompanyAdminJob, CreateCompanyJobPayload } from "@/services/company-admin/types";
import type { JobFormValues } from "../components/JobFormModal";

type UseCompanyAdminJobActionsOptions = {
  branches: CompanyAdminBranch[];
  selectedBranchId: number | null;
  setJobs: Dispatch<SetStateAction<CompanyAdminJob[]>>;
  onBranchChange: (nextBranchId: number) => void;
};

// Dùng cho màn company-admin/jobs: quản lý form/modal và mutate create-update-delete job.
export function useCompanyAdminJobActions({
  branches,
  selectedBranchId,
  setJobs,
  onBranchChange,
}: UseCompanyAdminJobActionsOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [previewJob, setPreviewJob] = useState<CompanyAdminJob | null>(null);
  const [isUploadingCvTemplate, setIsUploadingCvTemplate] = useState(false);
  const [cvTemplateFileName, setCvTemplateFileName] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const { control, register, handleSubmit, reset, setValue } = useForm<JobFormValues>({
    defaultValues: {
      batBuocCV: false,
      kyNangIds: [],
    },
  });

  // Dùng useWatch để theo dõi field value ổn định hơn với React Compiler.
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

  const handleOpenCreateModal = () => {
    setEditingJobId(null);
    setActionError("");
    resetForCreate();
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (job: CompanyAdminJob) => {
    if (!job.id) {
      return;
    }
    setEditingJobId(job.id);
    setActionError("");
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
    setIsCreateModalOpen(true);
  };

  const handleOpenPreviewModal = (job: CompanyAdminJob) => {
    setActionError("");
    setPreviewJob(job);
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

  const onSubmitForm = async (values: JobFormValues) => {
    if (!values.nganhNgheId || !values.loaiHinhLamViecId || !values.capDoKinhNghiemId) {
      setActionError("Vui lòng chọn ngành nghề, loại hình làm việc và cấp độ kinh nghiệm.");
      return;
    }

    setIsSubmitting(true);
    setActionError("");

    try {
      const basePayload = {
        tieuDe: values.tieuDe,
        nganhNgheId: Number(values.nganhNgheId),
        moTa: values.moTa,
        yeuCau: values.yeuCau,
        phucLoi: values.phucLoi,
        batBuocCV: Boolean(values.batBuocCV),
        mauCvUrl: values.mauCvUrl,
        loaiHinhLamViecId: Number(values.loaiHinhLamViecId),
        capDoKinhNghiemId: Number(values.capDoKinhNghiemId),
        luongToiThieu: values.luongToiThieu ? Number(values.luongToiThieu) : undefined,
        luongToiDa: values.luongToiDa ? Number(values.luongToiDa) : undefined,
        soLuongTuyen: Number(values.soLuongTuyen),
        denHanLuc: values.denHanLuc ? new Date(values.denHanLuc).toISOString() : undefined,
        kyNangIds: (values.kyNangIds ?? []).map(Number).filter((id) => Number.isFinite(id) && id > 0),
      };

      if (editingJobId != null) {
        const updated = await companyAdminJobsService.updateJob(editingJobId, basePayload);
        setJobs((current) => current.map((job) => (job.id === editingJobId ? updated : job)));
      } else {
        const created = await companyAdminJobsService.createJob({
          ...basePayload,
          chiNhanhId: Number(values.chiNhanhId),
        } as CreateCompanyJobPayload);
        setJobs((current) => [created, ...current]);
      }

      reset({ ...values, batBuocCV: false });
      setIsCreateModalOpen(false);
      setEditingJobId(null);
      setActionError("");
    } catch (submitError) {
      setActionError(getApiErrorMessage(submitError, "Không thể lưu tin tuyển dụng. Vui lòng thử lại."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJob = async (job: CompanyAdminJob) => {
    if (!job.id) {
      return;
    }

    const confirmed = window.confirm(`Xoá tin "${job.tieuDe ?? "này"}"?`);
    if (!confirmed) {
      return;
    }

    try {
      await companyAdminJobsService.deleteJob(job.id);
      setJobs((current) => current.filter((item) => item.id !== job.id));
      setActionError("");
    } catch (deleteError) {
      setActionError(getApiErrorMessage(deleteError, "Không thể xoá tin tuyển dụng."));
    }
  };

  const handleBranchChangeFromForm = (branchId: number) => {
    onBranchChange(branchId);
  };

  const handleSelectTemplate = (job: CompanyAdminJob) => {
    setValue("moTa", job.moTa ?? "", { shouldDirty: true });
    setValue("yeuCau", job.yeuCau ?? "", { shouldDirty: true });
    setValue("phucLoi", job.phucLoi ?? "", { shouldDirty: true });
  };

  return {
    isSubmitting,
    isCreateModalOpen,
    editingJobId,
    previewJob,
    isUploadingCvTemplate,
    cvTemplateFileName,
    actionError,
    register,
    handleSubmit,
    setValue,
    chiNhanhField,
    batBuocCVField,
    batBuocCV,
    mauCvUrlValue,
    moTaValue,
    yeuCauValue,
    phucLoiValue,
    selectedKyNangIds,
    setIsCreateModalOpen,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleOpenPreviewModal,
    setPreviewJob,
    handleUploadCvTemplate,
    handleDeleteJob,
    handleBranchChangeFromForm,
    handleSelectTemplate,
    onSubmitForm,
  };
}

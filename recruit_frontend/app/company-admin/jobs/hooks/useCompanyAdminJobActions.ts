"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { getApiErrorMessage } from "@/lib/api-error";
import { companyAdminJobsService } from "@/services/company-admin/jobs.service";
import type { CompanyAdminBranch, CompanyAdminJob, CreateCompanyJobPayload } from "@/services/company-admin/types";
import type { JobFormValues } from "../components/JobFormModal";
import { useJobFormState } from "./useJobFormState";

type UseCompanyAdminJobActionsOptions = {
  branches: CompanyAdminBranch[];
  selectedBranchId: number | null;
  setJobs: Dispatch<SetStateAction<CompanyAdminJob[]>>;
};

// Quản lý modal state và CRUD (create/update/delete) cho trang company-admin/jobs.
export function useCompanyAdminJobActions({
  branches,
  selectedBranchId,
  setJobs,
}: UseCompanyAdminJobActionsOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [previewJob, setPreviewJob] = useState<CompanyAdminJob | null>(null);
  const [actionError, setActionError] = useState("");

  const form = useJobFormState({ branches, selectedBranchId, setActionError });

  const handleOpenCreateModal = () => {
    setEditingJobId(null);
    setActionError("");
    form.resetForCreate();
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (job: CompanyAdminJob) => {
    if (!job.id) {
      return;
    }
    setEditingJobId(job.id);
    setActionError("");
    form.resetForEdit(job);
    setIsCreateModalOpen(true);
  };

  const handleOpenPreviewModal = (job: CompanyAdminJob) => {
    setActionError("");
    setPreviewJob(job);
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

  const onSubmitForm = async (values: JobFormValues) => {
    const loaiHinhLamViecIds = (values.loaiHinhLamViecIds ?? []).map(Number).filter((id) => Number.isFinite(id) && id > 0);
    const chiNhanhIds = (values.chiNhanhIds ?? []).map(Number).filter((id) => Number.isFinite(id) && id > 0);
    if (chiNhanhIds.length === 0) {
      setActionError("Vui lòng chọn ít nhất một chi nhánh áp dụng.");
      return;
    }
    if (!values.nganhNgheId || loaiHinhLamViecIds.length === 0 || !values.capDoKinhNghiemId) {
      setActionError("Vui lòng chọn ngành nghề, loại hình làm việc và cấp độ kinh nghiệm.");
      return;
    }
    if (isDeadlineBeforeToday(values.denHanLuc)) {
      setActionError("Hạn nộp không được là ngày trong quá khứ.");
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
        loaiHinhLamViecIds,
        capDoKinhNghiemId: Number(values.capDoKinhNghiemId),
        luongToiThieu: values.luongToiThieu ? Number(values.luongToiThieu) : undefined,
        luongToiDa: values.luongToiDa ? Number(values.luongToiDa) : undefined,
        soLuongTuyen: Number(values.soLuongTuyen),
        denHanLuc: values.denHanLuc ? new Date(values.denHanLuc).toISOString() : undefined,
        kyNangIds: (values.kyNangIds ?? []).map(Number).filter((id) => Number.isFinite(id) && id > 0),
        chiNhanhIds,
      };

      if (editingJobId != null) {
        const updated = await companyAdminJobsService.updateJob(editingJobId, basePayload);
        setJobs((current) => current.map((job) => (job.id === editingJobId ? updated : job)));
      } else {
        const created = await companyAdminJobsService.createJob(basePayload as CreateCompanyJobPayload);
        setJobs((current) => [created, ...current]);
      }

      form.reset({ ...values, batBuocCV: false });
      setIsCreateModalOpen(false);
      setEditingJobId(null);
      setActionError("");
    } catch (submitError) {
      setActionError(getApiErrorMessage(submitError, "Không thể lưu tin tuyển dụng. Vui lòng thử lại."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    isCreateModalOpen,
    editingJobId,
    previewJob,
    actionError,
    // form state (giữ nguyên tên để backward compat với caller)
    control: form.control,
    register: form.register,
    handleSubmit: form.handleSubmit,
    setValue: form.setValue,
    batBuocCVField: form.batBuocCVField,
    batBuocCV: form.batBuocCV,
    mauCvUrlValue: form.mauCvUrlValue,
    moTaValue: form.moTaValue,
    yeuCauValue: form.yeuCauValue,
    phucLoiValue: form.phucLoiValue,
    selectedKyNangIds: form.selectedKyNangIds,
    loaiHinhLamViecIds: form.loaiHinhLamViecIds,
    toggleWorkType: form.toggleWorkType,
    chiNhanhIds: form.chiNhanhIds,
    toggleBranch: form.toggleBranch,
    isUploadingCvTemplate: form.isUploadingCvTemplate,
    cvTemplateFileName: form.cvTemplateFileName,
    setIsCreateModalOpen,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleOpenPreviewModal,
    setPreviewJob,
    handleUploadCvTemplate: form.handleUploadCvTemplate,
    handleDeleteJob,
    handleSelectTemplate: form.handleSelectTemplate,
    onSubmitForm,
  };
}

function isDeadlineBeforeToday(value?: string) {
  if (!value) {
    return false;
  }

  const deadline = new Date(value);
  if (Number.isNaN(deadline.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return deadline < today;
}

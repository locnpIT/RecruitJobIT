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
  onBranchChange: (nextBranchId: number) => void;
};

// Quản lý modal state và CRUD (create/update/delete) cho trang company-admin/jobs.
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

  const handleBranchChangeFromForm = (branchId: number) => {
    onBranchChange(branchId);
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
    register: form.register,
    handleSubmit: form.handleSubmit,
    setValue: form.setValue,
    chiNhanhField: form.chiNhanhField,
    batBuocCVField: form.batBuocCVField,
    batBuocCV: form.batBuocCV,
    mauCvUrlValue: form.mauCvUrlValue,
    moTaValue: form.moTaValue,
    yeuCauValue: form.yeuCauValue,
    phucLoiValue: form.phucLoiValue,
    selectedKyNangIds: form.selectedKyNangIds,
    isUploadingCvTemplate: form.isUploadingCvTemplate,
    cvTemplateFileName: form.cvTemplateFileName,
    setIsCreateModalOpen,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleOpenPreviewModal,
    setPreviewJob,
    handleUploadCvTemplate: form.handleUploadCvTemplate,
    handleDeleteJob,
    handleBranchChangeFromForm,
    handleSelectTemplate: form.handleSelectTemplate,
    onSubmitForm,
  };
}

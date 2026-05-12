"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import {
  companyAdminService,
  type CompanyAdminBranch,
  type CompanyAdminJob,
  type CompanyJobMetadataOption,
  type CreateCompanyJobPayload,
} from "@/services/company-admin.service";
import { authService } from "@/services/auth.service";
import { isCompanyApproved } from "../company-admin-status";
import { CompanyAdminRestrictedNotice } from "../components/CompanyAdminRestrictedNotice";
import { JobFormModal, type JobFormValues } from "./components/JobFormModal";
import { JobsHeader } from "./components/JobsHeader";
import { JobsTable } from "./components/JobsTable";
import { Button } from "@/components/ui/Button";

// Màn quản lý tin tuyển dụng của công ty.
// Đây là container chính điều phối branch selection, metadata, CRUD job và upload mẫu CV.
export default function CompanyAdminJobsPage() {
  const [branches, setBranches] = useState<CompanyAdminBranch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [jobs, setJobs] = useState<CompanyAdminJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [companyStatus, setCompanyStatus] = useState<string | null>(null);
  const [canPostJobs, setCanPostJobs] = useState(true);
  const [nganhNgheOptions, setNganhNgheOptions] = useState<CompanyJobMetadataOption[]>([]);
  const [loaiHinhOptions, setLoaiHinhOptions] = useState<CompanyJobMetadataOption[]>([]);
  const [capDoOptions, setCapDoOptions] = useState<CompanyJobMetadataOption[]>([]);
  const [isUploadingCvTemplate, setIsUploadingCvTemplate] = useState(false);
  const [cvTemplateFileName, setCvTemplateFileName] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch, setValue } = useForm<JobFormValues>({
    defaultValues: {
      batBuocCV: false,
    },
  });
  const batBuocCv = watch("batBuocCV");
  const mauCvUrlValue = watch("mauCvUrl");
  const chiNhanhField = register("chiNhanhId", { valueAsNumber: true });
  const batBuocCvField = register("batBuocCV", {
    onChange: (event) => {
      if (!event.target.checked) {
        setValue("mauCvUrl", "");
        setCvTemplateFileName(null);
      }
    },
  });

  useEffect(() => {
    let active = true;

    companyAdminService.getMe()
      .then((response) => {
        if (!active) return;
        setCompanyStatus(response.congTy.trangThai ?? null);
        setCanPostJobs(Boolean(response.congTy.coQuyenDangBai));

        if (!isCompanyApproved(response.congTy.trangThai)) {
          setIsLoadingJobs(false);
          return;
        }

        return companyAdminService.getBranches()
          .then((responseBranches) => {
            if (!active) return;
            setBranches(responseBranches);
            const firstBranchId = responseBranches[0]?.chiNhanhId ?? null;
            setSelectedBranchId(firstBranchId);
            if (!firstBranchId) {
              setIsLoadingJobs(false);
            }
          })
          .then(() => companyAdminService.getJobMetadata())
          .then((metadata) => {
            if (!active) return;
            setNganhNgheOptions(metadata.nganhNghes ?? []);
            setLoaiHinhOptions(metadata.loaiHinhLamViecs ?? []);
            setCapDoOptions(metadata.capDoKinhNghiems ?? []);
          });
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedBranchId) {
      return;
    }

    let active = true;
    companyAdminService.getJobs(selectedBranchId)
      .then((response) => {
        if (active) setJobs(response);
      })
      .finally(() => {
        if (active) setIsLoadingJobs(false);
      });
    return () => {
      active = false;
    };
  }, [selectedBranchId]);

  const selectedBranch = useMemo(
    () => branches.find((branch) => branch.chiNhanhId === selectedBranchId) ?? null,
    [branches, selectedBranchId]
  );

  const onSubmit = async (values: JobFormValues) => {
    if (!values.nganhNgheId || !values.loaiHinhLamViecId || !values.capDoKinhNghiemId) {
      alert("Vui lòng chọn ngành nghề, loại hình làm việc và cấp độ kinh nghiệm.");
      return;
    }
    setIsSubmitting(true);
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
      };
      if (editingJobId != null) {
        const updated = await companyAdminService.updateJob(editingJobId, basePayload);
        setJobs((current) => current.map((job) => (job.id === editingJobId ? updated : job)));
      } else {
        const created = await companyAdminService.createJob({
          ...basePayload,
          chiNhanhId: Number(values.chiNhanhId),
        } as CreateCompanyJobPayload);
        setJobs((current) => [created, ...current]);
      }
      reset({ ...values, batBuocCV: false });
      setIsCreateModalOpen(false);
      setEditingJobId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingJobId(null);
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
    });
    setCvTemplateFileName(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (job: CompanyAdminJob) => {
    if (!job.id) return;
    setEditingJobId(job.id);
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
    });
    setCvTemplateFileName(null);
    setIsCreateModalOpen(true);
  };

  const handleUploadCvTemplate = async (file: File | null) => {
    if (!file) return;
    setIsUploadingCvTemplate(true);
    try {
      const signature = await authService.getCloudinarySignature("proof");
      const uploadedUrl = await authService.uploadToCloudinary(file, signature);
      setValue("mauCvUrl", uploadedUrl, { shouldDirty: true });
      setCvTemplateFileName(file.name);
    } catch {
      alert("Không thể upload mẫu CV. Vui lòng thử lại.");
    } finally {
      setIsUploadingCvTemplate(false);
    }
  };

  const handleDeleteJob = async (job: CompanyAdminJob) => {
    if (!job.id) return;
    const confirmed = window.confirm(`Xoá tin "${job.tieuDe ?? "này"}"?`);
    if (!confirmed) return;
    await companyAdminService.deleteJob(job.id);
    setJobs((current) => current.filter((item) => item.id !== job.id));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Đang tải dữ liệu...
      </div>
    );
  }

  if (!isCompanyApproved(companyStatus)) {
    return (
      <div className="space-y-5 text-slate-900">
        <header className="border-b border-slate-200 pb-4">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Tin tuyển dụng</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Quản lý tin tuyển dụng theo chi nhánh</h1>
        </header>
        <CompanyAdminRestrictedNotice />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <JobsHeader />

      <div className="space-y-5">
        <section className="border border-slate-200 p-5">
          {canPostJobs ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-950">Tạo tin tuyển dụng</h2>
                <Button type="button" onClick={handleOpenCreateModal}>
                  Tạo tin tuyển dụng
                </Button>
              </div>
              <p className="mt-1 text-sm text-slate-500">Bấm nút tạo tin để mở form nhập thông tin tuyển dụng.</p>
            </>
          ) : (
            <CompanyAdminRestrictedNotice
              title="Chưa có gói đăng bài"
              tone="danger"
              description="Công ty chưa có gói đăng bài đang hoạt động nên HR chưa thể tạo tin tuyển dụng. Bạn chỉ có thể xem danh sách tin hiện có."
            />
          )}
        </section>

        <section className="space-y-4">
          <div className="border border-slate-200 p-5">
            <label className="block text-sm font-medium text-slate-700">Danh sách theo chi nhánh</label>
            {branches.length > 0 ? (
              <div className="mt-2">
                <select
                  value={selectedBranchId ?? ""}
                  onChange={(event) => {
                    setIsLoadingJobs(true);
                    setSelectedBranchId(Number(event.target.value));
                  }}
                  className="w-full max-w-md rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {branches.map((branch) => (
                    <option key={branch.chiNhanhId} value={branch.chiNhanhId ?? ""}>
                      {branch.chiNhanhTen} {branch.congTyTen ? `- ${branch.congTyTen}` : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-slate-500">
                  {selectedBranch ? `${selectedBranch.chiNhanhTen} - ${selectedBranch.congTyTen}` : "Chưa có chi nhánh"}
                </p>
              </div>
            ) : (
              <p className="mt-1 text-sm text-slate-500">Chưa có chi nhánh</p>
            )}
          </div>

          <JobsTable jobs={jobs} isLoadingJobs={isLoadingJobs} onEdit={handleOpenEditModal} onDelete={(job) => void handleDeleteJob(job)} />
        </section>
      </div>

      <JobFormModal
        open={isCreateModalOpen}
        editingJobId={editingJobId}
        branches={branches}
        selectedBranchId={selectedBranchId}
        chiNhanhField={chiNhanhField}
        register={register}
        onBranchChange={(value) => {
          setIsLoadingJobs(true);
          setSelectedBranchId(value);
        }}
        onSubmit={handleSubmit(onSubmit)}
        onClose={() => setIsCreateModalOpen(false)}
        nganhNgheOptions={nganhNgheOptions}
        loaiHinhOptions={loaiHinhOptions}
        capDoOptions={capDoOptions}
        batBuocCv={batBuocCv}
        mauCvUrlValue={mauCvUrlValue}
        isUploadingCvTemplate={isUploadingCvTemplate}
        cvTemplateFileName={cvTemplateFileName}
        onUploadCvTemplate={handleUploadCvTemplate}
        batBuocCvField={batBuocCvField}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

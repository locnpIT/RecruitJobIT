"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CompanyAdminRestrictedNotice } from "../../components/CompanyAdminRestrictedNotice";
import { isCompanyApproved } from "../../company-admin-status";
import { JobFormModal } from "./JobFormModal";
import { JobPreviewModal } from "./JobPreviewModal";
import { JobsHeader } from "./JobsHeader";
import { JobsTable } from "./JobsTable";
import { useCompanyAdminJobsData } from "../hooks/useCompanyAdminJobsData";
import { useCompanyAdminJobActions } from "../hooks/useCompanyAdminJobActions";

// Client container của màn company-admin/jobs: giữ state + action, page.tsx chỉ còn compose.
export function CompanyAdminJobsClient() {
  const data = useCompanyAdminJobsData();
  const actions = useCompanyAdminJobActions({
    branches: data.branches,
    selectedBranchId: data.selectedBranchId,
    setJobs: data.setJobs,
  });

  if (data.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Đang tải dữ liệu...
      </div>
    );
  }

  if (!isCompanyApproved(data.companyStatus)) {
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

      {data.error || actions.actionError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {actions.actionError || data.error}
        </div>
      ) : null}

      <div className="space-y-5">
        <section className="border border-slate-200 p-5">
          {data.canPostJobs ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-950">Tạo tin tuyển dụng</h2>
                <Button type="button" onClick={actions.handleOpenCreateModal}>
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
            {data.branches.length > 0 ? (
              <div className="mt-2">
                <select
                  value={data.selectedBranchId ?? ""}
                  onChange={(event) => data.handleSelectBranch(Number(event.target.value))}
                  className="w-full max-w-md rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {data.branches.map((branch) => (
                    <option key={branch.chiNhanhId} value={branch.chiNhanhId ?? ""}>
                      {branch.chiNhanhTen} {branch.congTyTen ? `- ${branch.congTyTen}` : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-slate-500">
                  {data.selectedBranch
                    ? `${data.selectedBranch.chiNhanhTen} - ${data.selectedBranch.congTyTen}`
                    : "Chưa có chi nhánh"}
                </p>
              </div>
            ) : (
              <p className="mt-1 text-sm text-slate-500">Chưa có chi nhánh</p>
            )}
          </div>

          <JobsTable
            jobs={data.jobs}
            isLoadingJobs={data.isLoadingJobs}
            onView={actions.handleOpenPreviewModal}
            onEdit={actions.handleOpenEditModal}
            onDelete={(job) => void actions.handleDeleteJob(job)}
          />
        </section>
      </div>

        <JobFormModal
        open={actions.isCreateModalOpen}
        editingJobId={actions.editingJobId}
        branches={data.branches}
        selectedChiNhanhIds={actions.chiNhanhIds}
        onToggleBranch={actions.toggleBranch}
        register={actions.register}
        onSubmit={actions.handleSubmit(actions.onSubmitForm)}
        onClose={() => actions.setIsCreateModalOpen(false)}
        nganhNgheOptions={data.nganhNgheOptions}
        loaiHinhOptions={data.loaiHinhOptions}
        selectedLoaiHinhLamViecIds={actions.loaiHinhLamViecIds}
        onToggleWorkType={actions.toggleWorkType}
        capDoOptions={data.capDoOptions}
        kyNangOptions={data.kyNangOptions}
        selectedKyNangIds={actions.selectedKyNangIds}
        onKyNangIdsChange={(nextIds) => actions.setValue("kyNangIds", nextIds, { shouldDirty: true })}
        batBuocCV={actions.batBuocCV}
        mauCvUrlValue={actions.mauCvUrlValue}
        moTaValue={actions.moTaValue}
        yeuCauValue={actions.yeuCauValue}
        phucLoiValue={actions.phucLoiValue}
        onRichTextChange={(name, value) => actions.setValue(name, value, { shouldDirty: true })}
        isUploadingCvTemplate={actions.isUploadingCvTemplate}
        cvTemplateFileName={actions.cvTemplateFileName}
        onUploadCvTemplate={actions.handleUploadCvTemplate}
        batBuocCVField={actions.batBuocCVField}
        isSubmitting={actions.isSubmitting}
        templateJobs={data.jobs}
        onSelectTemplate={actions.handleSelectTemplate}
      />

      <JobPreviewModal
        open={actions.previewJob != null}
        job={actions.previewJob}
        company={data.company}
        onClose={() => actions.setPreviewJob(null)}
      />
    </div>
  );
}

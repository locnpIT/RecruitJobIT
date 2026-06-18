import { Loader2 } from "lucide-react";
import type { BaseSyntheticEvent } from "react";
import type { Control, UseFormRegisterReturn } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import type { CompanyAdminBranch, CompanyAdminJob, CompanyJobMetadataOption } from "@/services/company-admin/types";
import { JobFormCvTemplate } from "./JobFormCvTemplate";
import { JobFormField } from "./JobFormField";
import { JobFormSelectFields } from "./JobFormSelectFields";
import { JobSalaryField } from "./JobSalaryField";
import type { JobFormValues } from "./job-form-types";
import { formatDateTimeLocal, startOfToday } from "./job-form-utils";

export type { JobFormValues } from "./job-form-types";

type JobFormModalProps = {
  open: boolean;
  editingJobId: number | null;
  branches: CompanyAdminBranch[];
  selectedChiNhanhIds: number[];
  onToggleBranch: (branchId: number) => void;
  control: Control<JobFormValues>;
  register: (name: keyof JobFormValues, options?: Record<string, unknown>) => UseFormRegisterReturn;
  onSubmit: (event?: BaseSyntheticEvent) => void;
  onClose: () => void;
  nganhNgheOptions: CompanyJobMetadataOption[];
  loaiHinhOptions: CompanyJobMetadataOption[];
  selectedLoaiHinhLamViecIds: number[];
  onToggleWorkType: (workTypeId: number) => void;
  capDoOptions: CompanyJobMetadataOption[];
  kyNangOptions: CompanyJobMetadataOption[];
  selectedKyNangIds: number[];
  onKyNangIdsChange: (nextIds: number[]) => void;
  batBuocCV?: boolean;
  mauCvUrlValue?: string;
  moTaValue: string;
  yeuCauValue: string;
  phucLoiValue: string;
  onRichTextChange: (name: "moTa" | "yeuCau" | "phucLoi", value: string) => void;
  isUploadingCvTemplate: boolean;
  cvTemplateFileName: string | null;
  onUploadCvTemplate: (file: File | null) => void;
  batBuocCVField: UseFormRegisterReturn;
  isSubmitting: boolean;
  templateJobs?: CompanyAdminJob[];
  onSelectTemplate?: (job: CompanyAdminJob) => void;
};

// Modal tạo/cập nhật tin tuyển dụng của công ty.
// State và submit vẫn do page container quản lý; component này chỉ render form.
export function JobFormModal({
  open,
  editingJobId,
  branches,
  selectedChiNhanhIds,
  onToggleBranch,
  control,
  register,
  onSubmit,
  onClose,
  nganhNgheOptions,
  loaiHinhOptions,
  selectedLoaiHinhLamViecIds,
  onToggleWorkType,
  capDoOptions,
  kyNangOptions,
  selectedKyNangIds,
  onKyNangIdsChange,
  batBuocCV,
  mauCvUrlValue,
  moTaValue,
  yeuCauValue,
  phucLoiValue,
  onRichTextChange,
  isUploadingCvTemplate,
  cvTemplateFileName,
  onUploadCvTemplate,
  batBuocCVField,
  isSubmitting,
  templateJobs,
  onSelectTemplate,
}: JobFormModalProps) {
  if (!open) return null;

  const minDeadline = formatDateTimeLocal(startOfToday());

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-md border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">
              {editingJobId == null ? "Tạo tin tuyển dụng" : "Cập nhật tin tuyển dụng"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">Nhập thông tin tin tuyển dụng cho chi nhánh.</p>
          </div>
          <Button
            variant="unstyled"
            type="button"
            className="rounded-md border border-slate-300 px-2 py-1 text-slate-600 hover:bg-slate-50"
            onClick={onClose}
          >
            Đóng
          </Button>
        </div>

        {editingJobId == null && templateJobs && templateJobs.length > 0 && onSelectTemplate ? (
          <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="mb-1.5 text-xs font-medium text-slate-600">Dùng nội dung từ tin cũ làm template</p>
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              defaultValue=""
              onChange={(event) => {
                const job = templateJobs.find((item) => String(item.id) === event.target.value);
                if (job) onSelectTemplate(job);
              }}
            >
              <option value="">-- Không dùng template --</option>
              {templateJobs.map((job) => (
                <option key={job.id} value={String(job.id)}>
                  {job.tieuDe ?? `Job #${job.id}`}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-400">Chọn tin cũ để tự fill mô tả, yêu cầu và phúc lợi. Bạn có thể chỉnh lại sau.</p>
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={onSubmit}>
          <JobFormSelectFields
            branches={branches}
            selectedChiNhanhIds={selectedChiNhanhIds}
            onToggleBranch={onToggleBranch}
            register={register}
            nganhNgheOptions={nganhNgheOptions}
            loaiHinhOptions={loaiHinhOptions}
            selectedLoaiHinhLamViecIds={selectedLoaiHinhLamViecIds}
            onToggleWorkType={onToggleWorkType}
            capDoOptions={capDoOptions}
            kyNangOptions={kyNangOptions}
            selectedKyNangIds={selectedKyNangIds}
            onKyNangIdsChange={onKyNangIdsChange}
          />

          <JobFormField label="Số lượng tuyển" inputProps={register("soLuongTuyen", { valueAsNumber: true })} min={1} placeholder="2" type="number" />
          <JobSalaryField name="luongToiThieu" label="Lương tối thiểu" control={control} placeholder="15.000.000" />
          <JobSalaryField name="luongToiDa" label="Lương tối đa" control={control} placeholder="25.000.000" />

          <input type="hidden" {...register("phucLoi")} />
          <input type="hidden" {...register("moTa")} />
          <input type="hidden" {...register("yeuCau")} />

          <RichTextEditor label="Phúc lợi" value={phucLoiValue} onChange={(value) => onRichTextChange("phucLoi", value)} placeholder="Thưởng, bảo hiểm, phụ cấp..." />
          <RichTextEditor label="Mô tả công việc" value={moTaValue} onChange={(value) => onRichTextChange("moTa", value)} placeholder="Mô tả công việc..." />
          <RichTextEditor label="Yêu cầu ứng viên" value={yeuCauValue} onChange={(value) => onRichTextChange("yeuCau", value)} placeholder="Yêu cầu ứng viên..." />

          <JobFormField label="Hạn nộp" inputProps={register("denHanLuc")} min={minDeadline} type="datetime-local" />

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...batBuocCVField} />
            Bắt buộc đính kèm CV
          </label>

          {batBuocCV ? (
            <JobFormCvTemplate
              mauCvUrlValue={mauCvUrlValue}
              isUploadingCvTemplate={isUploadingCvTemplate}
              cvTemplateFileName={cvTemplateFileName}
              onUploadCvTemplate={onUploadCvTemplate}
            />
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang lưu...</>
              ) : editingJobId == null ? "Tạo tin tuyển dụng" : "Lưu cập nhật"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

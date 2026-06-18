import { Loader2 } from "lucide-react";
import type { BaseSyntheticEvent } from "react";
import { useController, type Control, type UseFormRegisterReturn } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import type { CompanyAdminBranch, CompanyAdminJob, CompanyJobMetadataOption } from "@/services/company-admin/types";
import { JobSkillsMultiSelect } from "./JobSkillsMultiSelect";

// Modal tạo/cập nhật tin tuyển dụng của công ty.
// Nhận state từ page container và chỉ đảm nhiệm phần nhập liệu + phát submit event.
export type JobFormValues = {
  chiNhanhIds: number[];
  tieuDe: string;
  nganhNgheId: number;
  moTa: string;
  yeuCau: string;
  phucLoi?: string;
  batBuocCV?: boolean;
  mauCvUrl?: string;
  loaiHinhLamViecIds: number[];
  capDoKinhNghiemId: number;
  luongToiThieu?: number;
  luongToiDa?: number;
  soLuongTuyen: number;
  denHanLuc?: string;
  kyNangIds: number[];
};

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
              onChange={(e) => {
                const job = templateJobs.find((j) => String(j.id) === e.target.value);
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

          <Field label="Số lượng tuyển" inputProps={register("soLuongTuyen", { valueAsNumber: true })} min={1} placeholder="2" type="number" />
          <SalaryField name="luongToiThieu" label="Lương tối thiểu" control={control} placeholder="15.000.000" />
          <SalaryField name="luongToiDa" label="Lương tối đa" control={control} placeholder="25.000.000" />

          <input type="hidden" {...register("phucLoi")} />
          <input type="hidden" {...register("moTa")} />
          <input type="hidden" {...register("yeuCau")} />

          <RichTextEditor label="Phúc lợi" value={phucLoiValue} onChange={(v) => onRichTextChange("phucLoi", v)} placeholder="Thưởng, bảo hiểm, phụ cấp..." />
          <RichTextEditor label="Mô tả công việc" value={moTaValue} onChange={(v) => onRichTextChange("moTa", v)} placeholder="Mô tả công việc..." />
          <RichTextEditor label="Yêu cầu ứng viên" value={yeuCauValue} onChange={(v) => onRichTextChange("yeuCau", v)} placeholder="Yêu cầu ứng viên..." />

          <Field label="Hạn nộp" inputProps={register("denHanLuc")} min={minDeadline} type="datetime-local" />

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

// --- Private sub-components ---

type JobFormSelectFieldsProps = {
  branches: CompanyAdminBranch[];
  selectedChiNhanhIds: number[];
  onToggleBranch: (branchId: number) => void;
  register: (name: keyof JobFormValues, options?: Record<string, unknown>) => UseFormRegisterReturn;
  nganhNgheOptions: CompanyJobMetadataOption[];
  loaiHinhOptions: CompanyJobMetadataOption[];
  selectedLoaiHinhLamViecIds: number[];
  onToggleWorkType: (workTypeId: number) => void;
  capDoOptions: CompanyJobMetadataOption[];
  kyNangOptions: CompanyJobMetadataOption[];
  selectedKyNangIds: number[];
  onKyNangIdsChange: (nextIds: number[]) => void;
};

function JobFormSelectFields({
  branches,
  selectedChiNhanhIds,
  onToggleBranch,
  register,
  nganhNgheOptions,
  loaiHinhOptions,
  selectedLoaiHinhLamViecIds,
  onToggleWorkType,
  capDoOptions,
  kyNangOptions,
  selectedKyNangIds,
  onKyNangIdsChange,
}: JobFormSelectFieldsProps) {
  return (
    <>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Chi nhánh áp dụng</label>
        <div className="grid gap-2 rounded-md border border-slate-300 bg-white p-3">
          {branches.map((branch) => {
            const branchId = branch.chiNhanhId ?? 0;
            return (
              <label key={branchId} className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={selectedChiNhanhIds.includes(branchId)}
                  onChange={() => onToggleBranch(branchId)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#008080] focus:ring-[#008080]"
                />
                <span>
                  <span className="block font-medium text-slate-900">{branch.chiNhanhTen}</span>
                  <span className="block text-xs text-slate-500">{branch.congTyTen ?? ""}</span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <Field label="Tiêu đề" inputProps={register("tieuDe")} placeholder="Tuyển dụng Backend Engineer" />

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Ngành nghề</label>
        <select {...register("nganhNgheId", { valueAsNumber: true })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value={0}>Chọn ngành nghề</option>
          {nganhNgheOptions.map((item) => (
            <option key={item.id ?? `nganh-${item.ten}`} value={item.id ?? 0}>{item.ten ?? "--"}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Loại hình làm việc</label>
        <div className="grid gap-2 rounded-md border border-slate-300 bg-white p-3">
          {loaiHinhOptions.map((item) => {
            const workTypeId = item.id ?? 0;
            return (
              <label key={workTypeId || `loaihinh-${item.ten}`} className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={selectedLoaiHinhLamViecIds.includes(workTypeId)}
                  onChange={() => onToggleWorkType(workTypeId)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#008080] focus:ring-[#008080]"
                />
                <span>
                  <span className="block font-medium text-slate-900">{item.ten ?? "--"}</span>
                  {item.moTa ? <span className="block text-xs text-slate-500">{item.moTa}</span> : null}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Cấp độ kinh nghiệm</label>
        <select {...register("capDoKinhNghiemId", { valueAsNumber: true })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value={0}>Chọn cấp độ kinh nghiệm</option>
          {capDoOptions.map((item) => (
            <option key={item.id ?? `capdo-${item.ten}`} value={item.id ?? 0}>
              {item.moTa ? `${item.ten ?? "--"} — ${item.moTa}` : (item.ten ?? "--")}
            </option>
          ))}
        </select>
      </div>

      <JobSkillsMultiSelect options={kyNangOptions} selectedIds={selectedKyNangIds} onChange={onKyNangIdsChange} />
    </>
  );
}

function JobFormCvTemplate({
  mauCvUrlValue,
  isUploadingCvTemplate,
  cvTemplateFileName,
  onUploadCvTemplate,
}: {
  mauCvUrlValue?: string;
  isUploadingCvTemplate: boolean;
  cvTemplateFileName: string | null;
  onUploadCvTemplate: (file: File | null) => void;
}) {
  return (
    <div className="space-y-2 rounded-md border border-slate-200 p-3">
      <p className="text-sm font-medium text-slate-800">Mẫu CV bắt buộc</p>
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={(event) => onUploadCvTemplate(event.target.files?.[0] ?? null)}
        className="block w-full text-sm text-slate-600 file:mr-4 file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700"
      />
      {isUploadingCvTemplate ? <p className="text-xs text-slate-500">Đang upload mẫu CV...</p> : null}
      {cvTemplateFileName ? <p className="text-xs text-slate-600">Đã tải: {cvTemplateFileName}</p> : null}
      {mauCvUrlValue ? (
        <a href={mauCvUrlValue} target="_blank" rel="noreferrer" className="text-xs text-blue-700 underline">
          Xem mẫu CV đã upload
        </a>
      ) : (
        <p className="text-xs text-amber-700">Chưa có mẫu CV, ứng viên sẽ không thấy file mẫu.</p>
      )}
    </div>
  );
}

function SalaryField({
  name,
  label,
  control,
  placeholder,
}: {
  name: "luongToiThieu" | "luongToiDa";
  label: string;
  control: Control<JobFormValues>;
  placeholder?: string;
}) {
  const { field } = useController({ name, control });
  const { name: inputName, onBlur, onChange, ref, value } = field;
  const displayValue =
    value != null && !Number.isNaN(value)
      ? new Intl.NumberFormat("vi-VN").format(value)
      : "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
    onChange(raw === "" ? undefined : Number(raw));
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center gap-2">
        <Input
          name={inputName}
          ref={ref}
          onBlur={onBlur}
          value={displayValue}
          onChange={handleChange}
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
        />
        <span className="shrink-0 text-sm font-medium text-slate-500">VNĐ</span>
      </div>
    </div>
  );
}

function Field({
  label,
  inputProps,
  min,
  placeholder,
  type = "text",
}: {
  label: string;
  inputProps: UseFormRegisterReturn;
  min?: string | number;
  placeholder?: string;
  type?: string;
}) {
  const preventNegativeInput = type === "number" && Number(min) >= 0;

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <Input
        {...inputProps}
        type={type}
        min={min}
        placeholder={placeholder}
        onKeyDown={(event) => {
          if (preventNegativeInput && ["-", "+", "e", "E"].includes(event.key)) {
            event.preventDefault();
          }
        }}
        onPaste={(event) => {
          if (preventNegativeInput && event.clipboardData.getData("text").trim().startsWith("-")) {
            event.preventDefault();
          }
        }}
      />
    </div>
  );
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function formatDateTimeLocal(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

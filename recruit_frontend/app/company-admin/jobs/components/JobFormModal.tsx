import { Loader2 } from "lucide-react";
import type { BaseSyntheticEvent } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { CompanyAdminBranch, CompanyJobMetadataOption } from "@/services/company-admin.service";

// Modal tạo/cập nhật tin tuyển dụng của công ty.
// Nhận state từ page container và chỉ đảm nhiệm phần nhập liệu + phát submit event.
type JobFormValues = {
  chiNhanhId: number;
  tieuDe: string;
  nganhNgheId: number;
  moTa: string;
  yeuCau: string;
  phucLoi?: string;
  batBuocCV?: boolean;
  mauCvUrl?: string;
  loaiHinhLamViecId: number;
  capDoKinhNghiemId: number;
  luongToiThieu?: number;
  luongToiDa?: number;
  soLuongTuyen: number;
  denHanLuc?: string;
};

type JobFormModalProps = {
  open: boolean;
  editingJobId: number | null;
  branches: CompanyAdminBranch[];
  selectedBranchId: number | null;
  chiNhanhField: UseFormRegisterReturn<"chiNhanhId">;
  register: (name: keyof JobFormValues, options?: Record<string, unknown>) => UseFormRegisterReturn;
  onBranchChange: (value: number) => void;
  onSubmit: (event?: BaseSyntheticEvent) => void;
  onClose: () => void;
  nganhNgheOptions: CompanyJobMetadataOption[];
  loaiHinhOptions: CompanyJobMetadataOption[];
  capDoOptions: CompanyJobMetadataOption[];
  batBuocCv?: boolean;
  mauCvUrlValue?: string;
  isUploadingCvTemplate: boolean;
  cvTemplateFileName: string | null;
  onUploadCvTemplate: (file: File | null) => void;
  batBuocCvField: UseFormRegisterReturn;
  isSubmitting: boolean;
};

export function JobFormModal({
  open,
  editingJobId,
  branches,
  selectedBranchId,
  chiNhanhField,
  register,
  onBranchChange,
  onSubmit,
  onClose,
  nganhNgheOptions,
  loaiHinhOptions,
  capDoOptions,
  batBuocCv,
  mauCvUrlValue,
  isUploadingCvTemplate,
  cvTemplateFileName,
  onUploadCvTemplate,
  batBuocCvField,
  isSubmitting,
}: JobFormModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-md border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">{editingJobId == null ? "Tạo tin tuyển dụng" : "Cập nhật tin tuyển dụng"}</h3>
            <p className="mt-1 text-sm text-slate-500">Nhập thông tin tin tuyển dụng cho chi nhánh.</p>
          </div>
          <button type="button" className="rounded-md border border-slate-300 px-2 py-1 text-slate-600 hover:bg-slate-50" onClick={onClose}>
            Đóng
          </button>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Chi nhánh</label>
            <select
              {...chiNhanhField}
              className="w-full border border-slate-300 bg-white px-3 py-2 text-sm"
              value={selectedBranchId ?? ""}
              onChange={(event) => {
                chiNhanhField.onChange(event);
                onBranchChange(Number(event.target.value));
              }}
            >
              {branches.map((branch) => (
                <option key={branch.chiNhanhId} value={branch.chiNhanhId ?? ""}>
                  {branch.chiNhanhTen} {branch.vaiTroCongTy ? `(${branch.vaiTroCongTy})` : ""}
                </option>
              ))}
            </select>
          </div>

          <Field label="Tiêu đề" inputProps={register("tieuDe")} placeholder="Tuyển dụng Backend Engineer" />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Ngành nghề</label>
            <select {...register("nganhNgheId", { valueAsNumber: true })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value={0}>Chọn ngành nghề</option>
              {nganhNgheOptions.map((item) => (
                <option key={item.id ?? `nganh-${item.ten}`} value={item.id ?? 0}>
                  {item.ten ?? "--"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Loại hình làm việc</label>
            <select {...register("loaiHinhLamViecId", { valueAsNumber: true })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value={0}>Chọn loại hình làm việc</option>
              {loaiHinhOptions.map((item) => (
                <option key={item.id ?? `loaihinh-${item.ten}`} value={item.id ?? 0}>
                  {item.ten ?? "--"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Cấp độ kinh nghiệm</label>
            <select {...register("capDoKinhNghiemId", { valueAsNumber: true })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value={0}>Chọn cấp độ kinh nghiệm</option>
              {capDoOptions.map((item) => (
                <option key={item.id ?? `capdo-${item.ten}`} value={item.id ?? 0}>
                  {item.ten ?? "--"}
                </option>
              ))}
            </select>
          </div>
          <Field label="Số lượng tuyển" inputProps={register("soLuongTuyen", { valueAsNumber: true })} placeholder="2" type="number" />
          <Field label="Lương tối thiểu" inputProps={register("luongToiThieu", { valueAsNumber: true })} placeholder="15000000" type="number" />
          <Field label="Lương tối đa" inputProps={register("luongToiDa", { valueAsNumber: true })} placeholder="25000000" type="number" />
          <Field label="Phúc lợi" inputProps={register("phucLoi")} placeholder="Thưởng, bảo hiểm, phụ cấp..." />

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Mô tả</label>
            <textarea {...register("moTa")} rows={4} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" placeholder="Mô tả công việc..." />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Yêu cầu</label>
            <textarea {...register("yeuCau")} rows={4} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" placeholder="Yêu cầu ứng viên..." />
          </div>

          <Field label="Hạn nộp" inputProps={register("denHanLuc")} type="datetime-local" />

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...batBuocCvField} />
            Bắt buộc đính kèm CV
          </label>

          {batBuocCv ? (
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
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : editingJobId == null ? (
                "Tạo tin tuyển dụng"
              ) : (
                "Lưu cập nhật"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Field input cục bộ cho modal job để chuẩn hóa label + Input component.
function Field({
  label,
  inputProps,
  placeholder,
  type = "text",
}: {
  label: string;
  inputProps: UseFormRegisterReturn;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <Input {...inputProps} type={type} placeholder={placeholder} />
    </div>
  );
}

export type { JobFormValues };

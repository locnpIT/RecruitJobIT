import { Building, Plus, Upload, X } from "lucide-react";
import { OwnerRegisterNotice } from "./OwnerRegisterNotice";
import type { OwnerProofTypeOption } from "@/services/auth.service";

export type OwnerProofRow = {
  id: number;
  loaiTaiLieuId: string;
  file: File | null;
};

type OwnerProofUploadSectionProps = {
  proofTypes: OwnerProofTypeOption[];
  proofTypesLoading: boolean;
  proofRows: OwnerProofRow[];
  proofError: string | null;
  onAddRow: () => void;
  onRemoveRow: (rowId: number) => void;
  onTypeChange: (rowId: number, nextTypeId: string) => void;
  onFileChange: (rowId: number, file: File | null) => void;
};

// Section upload minh chứng pháp lý công ty.
// UI cho phép owner đính kèm nhiều tài liệu ngay từ bước đăng ký.
export function OwnerProofUploadSection({
  proofTypes,
  proofTypesLoading,
  proofRows,
  proofError,
  onAddRow,
  onRemoveRow,
  onTypeChange,
  onFileChange,
}: OwnerProofUploadSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <Building size={18} className="text-blue-600" /> Minh chứng doanh nghiệp
        </h3>
        <button
          type="button"
          onClick={onAddRow}
          className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          <Plus size={16} />
          Thêm minh chứng
        </button>
      </div>

      <p className="text-sm text-slate-600">
        Công ty có thể tải nhiều minh chứng. Mỗi dòng cần chọn loại tài liệu và tệp tương ứng.
      </p>

      <div className="space-y-3">
        {proofRows.map((row, index) => (
          <div key={row.id} className="rounded-lg border border-slate-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Minh chứng #{index + 1}</p>
              <button
                type="button"
                onClick={() => onRemoveRow(row.id)}
                disabled={proofRows.length === 1}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                <X size={14} />
                Xóa
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_1.4fr]">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">Loại tài liệu</label>
                <select
                  value={row.loaiTaiLieuId}
                  onChange={(event) => onTypeChange(row.id, event.target.value)}
                  disabled={proofTypesLoading}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 disabled:bg-slate-100"
                >
                  <option value="">{proofTypesLoading ? "Đang tải loại tài liệu..." : "Chọn loại tài liệu"}</option>
                  {proofTypes.map((item) => (
                    <option key={item.id ?? `${item.ten}`} value={item.id ?? ""}>
                      {item.moTa ?? item.ten}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">Tệp minh chứng (PDF/Ảnh)</label>
                <label className="group relative block cursor-pointer rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition-all hover:border-blue-500">
                  <input
                    type="file"
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    onChange={(event) => onFileChange(row.id, event.target.files?.[0] ?? null)}
                  />
                  <Upload className="mx-auto mb-2 text-slate-400 group-hover:text-blue-500" size={24} />
                  <p className="text-sm text-slate-600">
                    {row.file ? <span className="font-bold text-blue-600">{row.file.name}</span> : "Chọn tệp minh chứng"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">Hỗ trợ PDF, JPG, PNG (Tối đa 10MB)</p>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {proofError ? <p className="text-xs font-medium text-red-500">{proofError}</p> : null}

      <OwnerRegisterNotice />
    </section>
  );
}

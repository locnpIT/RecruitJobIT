import type { CompanyProofType } from "@/services/company-admin.service";
import type { ProofRow } from "./types";

type CompanyProofsSectionProps = {
  companyApproved: boolean;
  proofTypes: CompanyProofType[];
  proofRows: ProofRow[];
  isSavingProofs: boolean;
  onAddRow: () => void;
  onRemoveRow: (rowId: string) => void;
  onUpdateRow: (rowId: string, updater: (row: ProofRow) => ProofRow) => void;
  onUploadAll: () => void;
};

// Khối upload nhiều minh chứng công ty cùng lúc.
export function CompanyProofsSection({
  companyApproved,
  proofTypes,
  proofRows,
  isSavingProofs,
  onAddRow,
  onRemoveRow,
  onUpdateRow,
  onUploadAll,
}: CompanyProofsSectionProps) {
  if (companyApproved) {
    return null;
  }

  return (
    <div className="border-t border-slate-200 pt-6">
      <h2 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        Minh chứng công ty
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        Tải nhiều file minh chứng cùng lúc. Mỗi file cần chọn đúng loại tài liệu tương ứng.
      </p>

      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-700">
            {proofTypes.length ? "Danh sách loại tài liệu đã có trong hệ thống" : "Đang tải loại tài liệu..."}
          </p>
          <button
            type="button"
            onClick={onAddRow}
            className="inline-flex items-center justify-center border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 hover:shadow-sm"
          >
            + Thêm file
          </button>
        </div>

        <div className="space-y-3">
          {proofRows.map((row, index) => (
            <div key={row.id} className="border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-900">Minh chứng {index + 1}</p>
                <button
                  type="button"
                  onClick={() => onRemoveRow(row.id)}
                  disabled={proofRows.length === 1}
                  className="inline-flex items-center justify-center border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 transition-all duration-200 hover:border-rose-300 hover:bg-rose-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Xoá
                </button>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Chọn file</span>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      onUpdateRow(row.id, (current) => ({
                        ...current,
                        file,
                        fileName: file?.name ?? null,
                      }));
                    }}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:transition file:hover:bg-emerald-700"
                  />
                  {row.fileName ? <p className="mt-2 text-xs text-slate-500">Đã chọn: {row.fileName}</p> : null}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Loại tài liệu</span>
                  <select
                    value={row.loaiTaiLieuId ?? ""}
                    onChange={(event) => {
                      const nextValue = event.target.value ? Number(event.target.value) : null;
                      onUpdateRow(row.id, (current) => ({
                        ...current,
                        loaiTaiLieuId: nextValue,
                      }));
                    }}
                    className="w-full border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
                  >
                    <option value="">Chọn loại tài liệu</option>
                    {proofTypes.map((type) => (
                      <option key={type.id ?? type.ten} value={type.id ?? ""}>
                        {type.moTa ?? type.ten ?? "--"}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onUploadAll}
          disabled={isSavingProofs || proofTypes.length === 0}
          className="inline-flex items-center justify-center border border-emerald-600 px-4 py-3 text-sm font-medium text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-700 hover:bg-emerald-600 hover:text-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {isSavingProofs ? "Đang tải lên..." : "Tải lên tất cả minh chứng"}
        </button>
      </div>
    </div>
  );
}

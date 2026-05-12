import type { CandidateEducationItem } from "@/services/candidate-profile.service";
import { ProfileActionButton } from "./ProfileActionButton";

// Panel quản lý học vấn trong hồ sơ ứng viên.
// Bao gồm form thêm học vấn mới và list các bản ghi học vấn đã tồn tại.
type EducationFormState = {
  tenTruong: string;
  chuyenNganh: string;
  bacHoc: string;
  thoiGianBatDau: string;
  thoiGianKetThuc: string;
  duongDanTep: string;
};

const proofStatusLabel: Record<string, string> = {
  PENDING: "Chờ admin duyệt",
  APPROVED: "Đã xác minh",
  REJECTED: "Minh chứng bị từ chối",
  UNVERIFIED: "Chưa xác minh",
};

const proofStatusClass: Record<string, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-800",
  UNVERIFIED: "border-slate-200 bg-slate-100 text-slate-700",
};

export function EducationPanel({
  form,
  submitting,
  uploadingProof,
  items,
  onChange,
  onCreate,
  onDelete,
  onUploadProof,
}: {
  form: EducationFormState;
  submitting: boolean;
  uploadingProof: boolean;
  items: CandidateEducationItem[];
  onChange: (next: EducationFormState) => void;
  onCreate: () => void;
  onDelete: (item: CandidateEducationItem) => void;
  onUploadProof: (file: File) => Promise<void>;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <h3 className="text-base font-semibold text-slate-900">Học vấn</h3>
      <p className="mt-1 text-xs text-slate-500">Thêm quá trình học tập và tải minh chứng nếu có.</p>
      <div className="mt-4 grid gap-2">
        <input placeholder="Tên trường *" value={form.tenTruong} onChange={(e) => onChange({ ...form, tenTruong: e.target.value })} className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
        <input placeholder="Chuyên ngành" value={form.chuyenNganh} onChange={(e) => onChange({ ...form, chuyenNganh: e.target.value })} className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
        <input placeholder="Bậc học" value={form.bacHoc} onChange={(e) => onChange({ ...form, bacHoc: e.target.value })} className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-1">
            <label className="text-xs font-medium text-slate-600">Từ ngày</label>
            <input type="date" value={form.thoiGianBatDau} onChange={(e) => onChange({ ...form, thoiGianBatDau: e.target.value })} className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-medium text-slate-600">Đến ngày</label>
            <input type="date" value={form.thoiGianKetThuc} onChange={(e) => onChange({ ...form, thoiGianKetThuc: e.target.value })} className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
          </div>
        </div>
      </div>
      <div className="mt-4 border-t border-slate-200 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
            <svg viewBox="0 0 20 20" fill="none" className="mr-1.5 h-4 w-4" aria-hidden="true">
              <path d="M10 13V4m0 0 3 3m-3-3L7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 13.5v1A1.5 1.5 0 0 0 5.5 16h9a1.5 1.5 0 0 0 1.5-1.5v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {uploadingProof ? "Đang tải minh chứng..." : "Tải minh chứng"}
            <input
              type="file"
              className="hidden"
              disabled={uploadingProof}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void onUploadProof(file);
                }
                e.currentTarget.value = "";
              }}
            />
          </label>
          {form.duongDanTep ? (
            <a href={form.duongDanTep} target="_blank" rel="noreferrer" className="text-xs text-slate-700 underline">
              Xem minh chứng
            </a>
          ) : null}
        </div>
      </div>
      <ProfileActionButton type="button" onClick={onCreate} disabled={submitting} className="mt-4 w-full">
          {submitting ? "Đang thêm..." : "Thêm học vấn"}
        </ProfileActionButton>

      <ul className="mt-4 space-y-2">
        {items.length === 0 ? <li className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500">Chưa có học vấn nào.</li> : null}
        {items.map((item) => {
          const dateRange = [item.thoiGianBatDau, item.thoiGianKetThuc].filter(Boolean).join(" - ");
          return (
            <li key={item.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.tenTruong}</p>
                  <p className="mt-0.5 text-xs text-slate-600">{[item.bacHoc, item.chuyenNganh].filter(Boolean).join(" • ") || "Chưa cập nhật"}</p>
                  {dateRange ? <p className="mt-1 text-xs text-slate-500">{dateRange}</p> : null}
                  <ProofStatus value={item.trangThai} />
                  {item.duongDanTep ? (
                    <a href={item.duongDanTep} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-slate-700 underline">
                      Xem minh chứng
                    </a>
                  ) : null}
                </div>
                <ProfileActionButton type="button" variant="danger" onClick={() => onDelete(item)} className="px-2 py-1 text-xs">
                  Xoá
                </ProfileActionButton>
              </div>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

function ProofStatus({ value }: { value: string | null }) {
  const normalized = (value ?? "UNVERIFIED").toUpperCase();
  return (
    <span className={`mt-2 inline-flex rounded border px-2 py-0.5 text-xs font-medium ${proofStatusClass[normalized] ?? proofStatusClass.UNVERIFIED}`}>
      {proofStatusLabel[normalized] ?? "Chưa xác minh"}
    </span>
  );
}

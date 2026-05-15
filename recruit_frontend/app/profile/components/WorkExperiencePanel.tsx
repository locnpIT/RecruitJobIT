import type { CandidateWorkExperienceItem } from "@/services/candidate-profile.service";
import { ProfileActionButton } from "./ProfileActionButton";

// Panel quản lý kinh nghiệm làm việc của ứng viên.
// Component chứa cả form thêm mới và danh sách các kinh nghiệm đã lưu.
type WorkExperienceFormState = {
  tenCongTy: string;
  chucDanh: string;
  moTaCongViec: string;
  thoiGianBatDau: string;
  thoiGianKetThuc: string;
};

export function WorkExperiencePanel({
  form,
  submitting,
  items,
  onChange,
  onCreate,
  onDelete,
}: {
  form: WorkExperienceFormState;
  submitting: boolean;
  items: CandidateWorkExperienceItem[];
  onChange: (next: WorkExperienceFormState) => void;
  onCreate: () => void;
  onDelete: (item: CandidateWorkExperienceItem) => void;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <h3 className="text-base font-semibold text-slate-900">Kinh nghiệm làm việc</h3>
      <p className="mt-1 text-xs text-slate-500">Thêm các vị trí đã làm để nhà tuyển dụng đánh giá năng lực thực tế.</p>

      <div className="mt-4 grid gap-2">
        <input
          placeholder="Tên công ty *"
          value={form.tenCongTy}
          onChange={(e) => onChange({ ...form, tenCongTy: e.target.value })}
          className="h-10 rounded-md border border-slate-300 px-3 text-sm"
        />
        <input
          placeholder="Chức danh"
          value={form.chucDanh}
          onChange={(e) => onChange({ ...form, chucDanh: e.target.value })}
          className="h-10 rounded-md border border-slate-300 px-3 text-sm"
        />
        <textarea
          placeholder="Mô tả công việc"
          value={form.moTaCongViec}
          onChange={(e) => onChange({ ...form, moTaCongViec: e.target.value })}
          rows={3}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-1">
            <label className="text-xs font-medium text-slate-600">Từ ngày</label>
            <input
              type="date"
              value={form.thoiGianBatDau}
              onChange={(e) => onChange({ ...form, thoiGianBatDau: e.target.value })}
              className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-medium text-slate-600">Đến ngày</label>
            <input
              type="date"
              value={form.thoiGianKetThuc}
              onChange={(e) => onChange({ ...form, thoiGianKetThuc: e.target.value })}
              className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            />
          </div>
        </div>
      </div>

      <ProfileActionButton type="button" onClick={onCreate} disabled={submitting} className="mt-4 w-full">
        {submitting ? "Đang thêm..." : "Thêm kinh nghiệm"}
      </ProfileActionButton>

      <ul className="mt-4 space-y-2">
        {items.length === 0 ? (
          <li className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500">
            Chưa có kinh nghiệm làm việc nào.
          </li>
        ) : null}
        {items.map((item) => {
          const dateRange = [item.thoiGianBatDau, item.thoiGianKetThuc].filter(Boolean).join(" - ");
          return (
            <li key={item.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.tenCongTy}</p>
                  <p className="mt-0.5 text-xs text-slate-600">{item.chucDanh || "Chưa cập nhật chức danh"}</p>
                  {dateRange ? <p className="mt-1 text-xs text-slate-500">{dateRange}</p> : null}
                  {item.moTaCongViec ? <p className="mt-2 text-xs leading-5 text-slate-700">{item.moTaCongViec}</p> : null}
                </div>
                <ProfileActionButton
                  type="button"
                  variant="danger"
                  onClick={() => onDelete(item)}
                  className="px-2 py-1 text-xs"
                >
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

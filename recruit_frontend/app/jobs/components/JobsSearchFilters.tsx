"use client";

import type { PublicJobSearchMetadata, SearchJobsParams } from "@/services/public-job.service";

type JobsSearchFiltersProps = {
  value: SearchJobsParams;
  metadata: PublicJobSearchMetadata | null;
  onChange: (next: SearchJobsParams) => void;
  onSubmit: () => void;
  onReset: () => void;
  loading: boolean;
};

/**
 * Form filter search cho trang danh sách việc làm.
 * Tách riêng khỏi page để dễ bảo trì khi thêm điều kiện tìm kiếm mới.
 */
export function JobsSearchFilters({ value, metadata, onChange, onSubmit, onReset, loading }: JobsSearchFiltersProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Từ khóa</span>
          <input
            value={value.tuKhoa ?? ""}
            onChange={(event) => onChange({ ...value, tuKhoa: event.target.value, trang: 0 })}
            placeholder="VD: Java backend, React..."
            className="h-10 rounded-md border border-slate-300 px-3 outline-none focus:border-slate-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Địa điểm</span>
          <input
            value={value.diaDiem ?? ""}
            onChange={(event) => onChange({ ...value, diaDiem: event.target.value, trang: 0 })}
            placeholder="VD: Hồ Chí Minh, Hà Nội..."
            className="h-10 rounded-md border border-slate-300 px-3 outline-none focus:border-slate-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Ngành nghề</span>
          <select
            value={value.nganhNgheId ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                nganhNgheId: event.target.value ? Number(event.target.value) : undefined,
                trang: 0,
              })
            }
            className="h-10 rounded-md border border-slate-300 px-3 outline-none focus:border-slate-500"
          >
            <option value="">Tất cả ngành</option>
            {(metadata?.nganhNghes ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.ten}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Loại hình</span>
          <select
            value={value.loaiHinhLamViecId ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                loaiHinhLamViecId: event.target.value ? Number(event.target.value) : undefined,
                trang: 0,
              })
            }
            className="h-10 rounded-md border border-slate-300 px-3 outline-none focus:border-slate-500"
          >
            <option value="">Tất cả loại hình</option>
            {(metadata?.loaiHinhLamViecs ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.ten}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Cấp độ kinh nghiệm</span>
          <select
            value={value.capDoKinhNghiemId ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                capDoKinhNghiemId: event.target.value ? Number(event.target.value) : undefined,
                trang: 0,
              })
            }
            className="h-10 rounded-md border border-slate-300 px-3 outline-none focus:border-slate-500"
          >
            <option value="">Tất cả cấp độ</option>
            {(metadata?.capDoKinhNghiems ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.ten}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="h-10 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          Tìm kiếm
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={loading}
          className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          Xóa bộ lọc
        </button>
      </div>
    </section>
  );
}

"use client";

import { useMemo, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useProvinces } from "@/app/hooks/useProvinces";
import { Button } from "@/components/ui/Button";
import type { PublicJobSearchMetadata, SearchJobsParams } from "@/services/public/public-job.service";

type JobsSearchFiltersProps = {
  value: SearchJobsParams;
  metadata: PublicJobSearchMetadata | null;
  onChange: (next: SearchJobsParams) => void;
  onSubmit: () => void;
  onReset: () => void;
  loading: boolean;
};

type FilterOption = {
  id: number;
  ten: string;
};

const INPUT_CLASS_NAME = "h-10 rounded-md border border-slate-300 px-3 outline-none focus:border-slate-500";

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: string | number;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: FilterOption[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={INPUT_CLASS_NAME}
    >
      <option value="">{placeholder}</option>
      {options.map((item) => (
        <option key={item.id} value={item.id}>
          {item.ten}
        </option>
      ))}
    </select>
  );
}

/**
 * Form filter search cho trang danh sách việc làm.
 * Tách riêng khỏi page để dễ bảo trì khi thêm điều kiện tìm kiếm mới.
 */
export function JobsSearchFilters({ value, metadata, onChange, onSubmit, onReset, loading }: JobsSearchFiltersProps) {
  const { provinces, isLoadingProvinces, provinceError } = useProvinces();

  const selectedProvinceId = useMemo(() => {
    if (!value.diaDiem) {
      return "";
    }
    const selected = provinces.find((item) => item.ten === value.diaDiem);
    return selected ? String(selected.id) : "";
  }, [provinces, value.diaDiem]);

  // Search thực tế được thực thi ở hook cha (useJobsSearch -> publicJobService.searchJobs).
  // Backend sẽ tự đi nhánh Elasticsearch khi APP_ELASTICSEARCH_ENABLED=true.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <form onSubmit={handleSubmit}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <FilterField label="Từ khóa">
          <input
            value={value.tuKhoa ?? ""}
            onChange={(event) => onChange({ ...value, tuKhoa: event.target.value, trang: 0 })}
            placeholder="VD: Java backend, React..."
            className={INPUT_CLASS_NAME}
          />
        </FilterField>

        <FilterField label="Địa điểm">
          <select
            value={selectedProvinceId}
            onChange={(event) => {
              const provinceId = event.target.value ? Number(event.target.value) : null;
              const provinceName = provinceId == null ? "" : provinces.find((item) => item.id === provinceId)?.ten ?? "";
              onChange({ ...value, diaDiem: provinceName, trang: 0 });
            }}
            disabled={isLoadingProvinces || Boolean(provinceError)}
            className={INPUT_CLASS_NAME}
          >
            <option value="">
              {isLoadingProvinces ? "Đang tải tỉnh/thành..." : provinceError || "Tất cả tỉnh/thành"}
            </option>
            {provinces.map((province) => (
              <option key={province.id} value={province.id}>
                {province.ten}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Ngành nghề">
          <FilterSelect
            value={value.nganhNgheId ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                nganhNgheId: event.target.value ? Number(event.target.value) : undefined,
                trang: 0,
              })
            }
            options={metadata?.nganhNghes ?? []}
            placeholder="Tất cả ngành"
          />
        </FilterField>

        <FilterField label="Loại hình">
          <FilterSelect
            value={value.loaiHinhLamViecId ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                loaiHinhLamViecId: event.target.value ? Number(event.target.value) : undefined,
                trang: 0,
              })
            }
            options={metadata?.loaiHinhLamViecs ?? []}
            placeholder="Tất cả loại hình"
          />
        </FilterField>

        <FilterField label="Cấp độ kinh nghiệm">
          <FilterSelect
            value={value.capDoKinhNghiemId ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                capDoKinhNghiemId: event.target.value ? Number(event.target.value) : undefined,
                trang: 0,
              })
            }
            options={metadata?.capDoKinhNghiems ?? []}
            placeholder="Tất cả cấp độ"
          />
        </FilterField>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="h-10 px-4 text-sm font-semibold disabled:bg-slate-400"
          >
            Tìm kiếm
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            disabled={loading}
            className="h-10 px-4 text-sm font-semibold disabled:bg-slate-500"
          >
            Xóa bộ lọc
          </Button>
        </div>
      </form>
    </section>
  );
}

import { Building, Minus, Plus } from "lucide-react";
import type { FieldArrayWithId, FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { OwnerFormValues } from "./types";

type SelectOption = {
  value: string;
  label: string;
};

type WardOption = {
  id: number;
  ten: string;
};

type OwnerBranchesSectionProps = {
  fields: FieldArrayWithId<OwnerFormValues, "chiNhanhs", "id">[];
  watchedBranches: OwnerFormValues["chiNhanhs"] | undefined;
  errors: FieldErrors<OwnerFormValues>;
  register: UseFormRegister<OwnerFormValues>;
  setValue: UseFormSetValue<OwnerFormValues>;
  primaryBranchIndex: number;
  provinceOptions: SelectOption[];
  wardOptionsByProvinceId: Record<number, WardOption[]>;
  wardLoadingProvinceIds: number[];
  getProvinceLabel: (provinceId?: string) => string;
  onAddBranch: () => void;
  onRemoveBranch: (index: number) => void;
  onSetPrimaryBranch: (index: number) => void;
};

// Section quản lý danh sách chi nhánh khi đăng ký owner.
export function OwnerBranchesSection({
  fields,
  watchedBranches,
  errors,
  register,
  setValue,
  primaryBranchIndex,
  provinceOptions,
  wardOptionsByProvinceId,
  wardLoadingProvinceIds,
  getProvinceLabel,
  onAddBranch,
  onRemoveBranch,
  onSetPrimaryBranch,
}: OwnerBranchesSectionProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <Building size={18} className="text-blue-600" /> Chi nhánh
          </h3>
          <p className="mt-1 text-sm text-slate-600">Có thể thêm nhiều chi nhánh. Chọn một chi nhánh làm chi nhánh chính.</p>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={onAddBranch}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm chi nhánh
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <article key={field.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-semibold text-slate-900">Chi nhánh {index + 1}</h4>
                <p className="mt-1 text-xs text-slate-500">Chi nhánh đang được chọn làm chính: {primaryBranchIndex === index ? "Có" : "Không"}</p>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <input type="radio" name="primaryBranch" checked={primaryBranchIndex === index} onChange={() => onSetPrimaryBranch(index)} />
                  Chi nhánh chính
                </label>
                {fields.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => onRemoveBranch(index)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100"
                  >
                    <Minus size={16} />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">Tên chi nhánh</label>
                <Input {...register(`chiNhanhs.${index}.tenChiNhanh`)} placeholder="Trụ sở chính" />
                {errors.chiNhanhs?.[index]?.tenChiNhanh ? (
                  <p className="mt-1 text-xs text-red-500">{errors.chiNhanhs[index]?.tenChiNhanh?.message}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">Địa chỉ chi nhánh</label>
                <Input {...register(`chiNhanhs.${index}.diaChiChiTietChiNhanh`)} placeholder="123 Nguyễn Huệ, Quận 1, TP.HCM" />
                {errors.chiNhanhs?.[index]?.diaChiChiTietChiNhanh ? (
                  <p className="mt-1 text-xs text-red-500">{errors.chiNhanhs[index]?.diaChiChiTietChiNhanh?.message}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">Tỉnh/thành</label>
                <select
                  {...register(`chiNhanhs.${index}.tinhThanhId`, {
                    onChange: () => {
                      setValue(`chiNhanhs.${index}.tenXaPhuong`, "");
                    },
                  })}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
                >
                  <option value="">Chọn tỉnh/thành</option>
                  {provinceOptions.map((province) => (
                    <option key={province.value} value={province.value}>
                      {province.label}
                    </option>
                  ))}
                </select>
                {errors.chiNhanhs?.[index]?.tinhThanhId ? (
                  <p className="mt-1 text-xs text-red-500">{errors.chiNhanhs[index]?.tinhThanhId?.message}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">Phường/Xã</label>
                <select
                  {...register(`chiNhanhs.${index}.tenXaPhuong`)}
                  disabled={!watchedBranches?.[index]?.tinhThanhId || wardLoadingProvinceIds.includes(Number(watchedBranches?.[index]?.tinhThanhId))}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">
                    {!watchedBranches?.[index]?.tinhThanhId
                      ? "Chọn tỉnh/thành trước"
                      : wardLoadingProvinceIds.includes(Number(watchedBranches?.[index]?.tinhThanhId))
                        ? "Đang tải phường/xã..."
                        : "Chọn phường/xã"}
                  </option>
                  {(wardOptionsByProvinceId[Number(watchedBranches?.[index]?.tinhThanhId)] ?? []).map((ward) => (
                    <option key={ward.id} value={ward.ten}>
                      {ward.ten}
                    </option>
                  ))}
                </select>
                {errors.chiNhanhs?.[index]?.tenXaPhuong ? (
                  <p className="mt-1 text-xs text-red-500">{errors.chiNhanhs[index]?.tenXaPhuong?.message}</p>
                ) : null}
              </div>
            </div>

            {watchedBranches?.[index]?.tinhThanhId ? (
              <p className="mt-3 text-xs text-slate-500">Tỉnh/thành đã chọn: {getProvinceLabel(watchedBranches[index]?.tinhThanhId)}</p>
            ) : null}
          </article>
        ))}

        {errors.chiNhanhs && typeof errors.chiNhanhs.message === "string" ? (
          <p className="text-sm text-red-500">{errors.chiNhanhs.message}</p>
        ) : null}
      </div>
    </section>
  );
}

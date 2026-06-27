import type { UseFormRegisterReturn } from "react-hook-form";

import type { CompanyAdminBranch, CompanyJobMetadataOption } from "@/services/company-admin/types";
import { JobSkillsMultiSelect } from "./JobSkillsMultiSelect";
import { JobFormField } from "./JobFormField";
import type { JobFormValues } from "./job-form-types";

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

export function JobFormSelectFields({
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

      <JobFormField label="Tiêu đề" inputProps={register("tieuDe")} placeholder="Tuyển dụng Backend Engineer" />

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
        <div className="grid max-h-56 gap-2 overflow-y-auto rounded-md border border-slate-300 bg-white p-3">
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
              {item.moTa ? `${item.ten ?? "--"} - ${item.moTa}` : (item.ten ?? "--")}
            </option>
          ))}
        </select>
      </div>

      <JobSkillsMultiSelect options={kyNangOptions} selectedIds={selectedKyNangIds} onChange={onKyNangIdsChange} />
    </>
  );
}

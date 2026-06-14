"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { locationService, type Province, type Ward } from "@/services/common/location.service";
import type { AdminCompanyDetailBranch, UpdateAdminCompanyBranchPayload } from "@/services/admin/types";

type CompanyBranchFormModalProps = {
  branch: AdminCompanyDetailBranch | null;
  isCreating: boolean;
  isMutating: boolean;
  onClose: () => void;
  onCreateBranch: (payload: UpdateAdminCompanyBranchPayload) => Promise<boolean>;
  onUpdateBranch: (branchId: number, payload: UpdateAdminCompanyBranchPayload) => Promise<boolean>;
};

type BranchFormState = {
  ten: string;
  diaChiChiTiet: string;
  tinhThanhId: string;
  xaPhuongId: string;
  laTruSoChinh: boolean;
};

const EMPTY_BRANCH_FORM: BranchFormState = {
  ten: "",
  diaChiChiTiet: "",
  tinhThanhId: "",
  xaPhuongId: "",
  laTruSoChinh: false,
};

export function CompanyBranchFormModal({
  branch,
  isCreating,
  isMutating,
  onClose,
  onCreateBranch,
  onUpdateBranch,
}: CompanyBranchFormModalProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wardsByProvince, setWardsByProvince] = useState<Record<number, Ward[]>>({});
  const [loadingWardIds, setLoadingWardIds] = useState<number[]>([]);
  const [branchForm, setBranchForm] = useState<BranchFormState>(() => (isCreating ? EMPTY_BRANCH_FORM : mapBranchToForm(branch)));

  useEffect(() => {
    locationService.getProvinces()
      .then(setProvinces)
      .catch(() => toast.error("Không tải được danh sách tỉnh/thành."));
  }, []);

  const loadWards = useCallback(async (tinhThanhId: number) => {
    if (!Number.isFinite(tinhThanhId) || tinhThanhId <= 0) {
      return;
    }
    if (wardsByProvince[tinhThanhId] || loadingWardIds.includes(tinhThanhId)) {
      return;
    }
    setLoadingWardIds((prev) => [...prev, tinhThanhId]);
    try {
      const wards = await locationService.getWards(tinhThanhId);
      setWardsByProvince((prev) => ({ ...prev, [tinhThanhId]: wards }));
    } catch {
      toast.error("Không tải được danh sách phường/xã.");
    } finally {
      setLoadingWardIds((prev) => prev.filter((id) => id !== tinhThanhId));
    }
  }, [loadingWardIds, wardsByProvince]);

  const handleProvinceChange = (tinhThanhId: string) => {
    setBranchForm((prev) => ({
      ...prev,
      tinhThanhId,
      xaPhuongId: "",
    }));
    const provinceId = Number(tinhThanhId);
    if (provinceId > 0) {
      void loadWards(provinceId);
    }
  };

  const currentProvinceId = Number(branchForm.tinhThanhId);
  const wardOptions = useMemo(
    () => (currentProvinceId > 0 ? wardsByProvince[currentProvinceId] ?? [] : []),
    [currentProvinceId, wardsByProvince],
  );
  const isWardLoading = currentProvinceId > 0 && loadingWardIds.includes(currentProvinceId);

  const handleSubmit = async () => {
    const payload = buildBranchPayload(branchForm);
    if (!payload) {
      toast.error("Vui lòng nhập đủ thông tin chi nhánh.");
      return;
    }

    let success = false;
    if (isCreating) {
      success = await onCreateBranch(payload);
    } else if (branch?.id != null) {
      success = await onUpdateBranch(branch.id, payload);
    } else {
      toast.error("Không xác định được chi nhánh để sửa.");
      return;
    }

    if (success) {
      onClose();
    }
  };

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">
          {isCreating ? "Thêm chi nhánh mới" : "Sửa chi nhánh"}
        </p>
        <Button variant="unstyled" type="button" disabled={isMutating} onClick={onClose} className="text-xs text-slate-500">
          Hủy
        </Button>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Field label="Tên chi nhánh *">
          <input
            value={branchForm.ten}
            onChange={(event) => setBranchForm((prev) => ({ ...prev, ten: event.target.value }))}
            className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            placeholder="Nhập tên chi nhánh"
          />
        </Field>

        <Field label="Tỉnh/Thành *">
          <select
            value={branchForm.tinhThanhId}
            onChange={(event) => handleProvinceChange(event.target.value)}
            className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
          >
            <option value="">Chọn tỉnh/thành</option>
            {provinces.map((province) => (
              <option key={province.id} value={province.id}>
                {province.ten}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Địa chỉ chi tiết *">
          <input
            value={branchForm.diaChiChiTiet}
            onChange={(event) => setBranchForm((prev) => ({ ...prev, diaChiChiTiet: event.target.value }))}
            className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            placeholder="Số nhà, đường..."
          />
        </Field>

        <Field label="Phường/Xã *">
          <select
            value={branchForm.xaPhuongId}
            disabled={!branchForm.tinhThanhId || isWardLoading}
            onChange={(event) => setBranchForm((prev) => ({ ...prev, xaPhuongId: event.target.value }))}
            className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <option value="">
              {!branchForm.tinhThanhId ? "Chọn tỉnh trước" : isWardLoading ? "Đang tải..." : "Chọn phường/xã"}
            </option>
            {wardOptions.map((ward) => (
              <option key={ward.id} value={ward.id}>
                {ward.ten}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={branchForm.laTruSoChinh}
          onChange={(event) => setBranchForm((prev) => ({ ...prev, laTruSoChinh: event.target.checked }))}
          className="accent-slate-900"
        />
        Đặt làm trụ sở chính
      </label>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" type="button" disabled={isMutating} onClick={onClose}>
          Hủy
        </Button>
        <Button variant="primary" type="button" disabled={isMutating} onClick={() => void handleSubmit()}>
          {isMutating ? "Đang lưu..." : isCreating ? "Thêm chi nhánh" : "Lưu thay đổi"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function mapBranchToForm(branch: AdminCompanyDetailBranch | null): BranchFormState {
  if (!branch) {
    return EMPTY_BRANCH_FORM;
  }
  return {
    ten: branch.ten ?? "",
    diaChiChiTiet: branch.diaChiChiTiet ?? "",
    tinhThanhId: branch.tinhThanhId ? String(branch.tinhThanhId) : "",
    xaPhuongId: branch.xaPhuongId ? String(branch.xaPhuongId) : "",
    laTruSoChinh: Boolean(branch.laTruSoChinh),
  };
}

function buildBranchPayload(form: BranchFormState): UpdateAdminCompanyBranchPayload | null {
  if (!form.ten.trim() || !form.diaChiChiTiet.trim() || !form.xaPhuongId) {
    return null;
  }
  return {
    ten: form.ten.trim(),
    diaChiChiTiet: form.diaChiChiTiet.trim(),
    xaPhuongId: Number(form.xaPhuongId),
    laTruSoChinh: form.laTruSoChinh,
  };
}

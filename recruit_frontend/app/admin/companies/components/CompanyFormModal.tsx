"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { locationService, type Province, type Ward } from "@/services/common/location.service";
import type { AdminCompany, CreateAdminCompanyBranchPayload } from "@/services/admin/types";

type CompanyFormState = {
  ten: string;
  maSoThue: string;
  website: string;
  moTa: string;
};

// BranchFormItem extends payload với tinhThanhId dùng để load wards (không gửi lên server)
type BranchFormItem = CreateAdminCompanyBranchPayload & { tinhThanhId: string };

const EMPTY_FORM: CompanyFormState = { ten: "", maSoThue: "", website: "", moTa: "" };
const EMPTY_BRANCH = (): BranchFormItem => ({
  ten: "",
  diaChiChiTiet: "",
  xaPhuongId: undefined,
  laTruSoChinh: false,
  tinhThanhId: "",
});

export function CompanyFormModal({
  editingCompany,
  submitting,
  onClose,
  onSubmit,
}: {
  editingCompany: AdminCompany | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (form: CompanyFormState & { chiNhanhs: CreateAdminCompanyBranchPayload[] }) => void;
}) {
  const [form, setForm] = useState<CompanyFormState>(EMPTY_FORM);
  const [branches, setBranches] = useState<BranchFormItem[]>([{ ...EMPTY_BRANCH(), laTruSoChinh: true }]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wardsByProvince, setWardsByProvince] = useState<Record<number, Ward[]>>({});
  const [loadingWardIds, setLoadingWardIds] = useState<number[]>([]);

  useEffect(() => {
    locationService.getProvinces()
      .then(setProvinces)
      .catch(() => toast.error("Không tải được danh sách tỉnh/thành."));
  }, []);

  useEffect(() => {
    if (editingCompany) {
      setForm({ ten: editingCompany.ten ?? "", maSoThue: editingCompany.maSoThue ?? "", website: editingCompany.website ?? "", moTa: "" });
    } else {
      setForm(EMPTY_FORM);
      setBranches([{ ...EMPTY_BRANCH(), laTruSoChinh: true }]);
    }
  }, [editingCompany]);

  const loadWards = async (tinhThanhId: number) => {
    if (wardsByProvince[tinhThanhId] || loadingWardIds.includes(tinhThanhId)) return;
    setLoadingWardIds((prev) => [...prev, tinhThanhId]);
    try {
      const wards = await locationService.getWards(tinhThanhId);
      setWardsByProvince((prev) => ({ ...prev, [tinhThanhId]: wards }));
    } catch {
      toast.error("Không tải được danh sách phường/xã.");
    } finally {
      setLoadingWardIds((prev) => prev.filter((id) => id !== tinhThanhId));
    }
  };

  const addBranch = () => setBranches((prev) => [...prev, EMPTY_BRANCH()]);

  const removeBranch = (index: number) => {
    setBranches((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (prev[index].laTruSoChinh && next.length > 0) {
        next[0] = { ...next[0], laTruSoChinh: true };
      }
      return next;
    });
  };

  const setMainBranch = (index: number) => {
    setBranches((prev) => prev.map((b, i) => ({ ...b, laTruSoChinh: i === index })));
  };

  const updateBranch = (index: number, patch: Partial<BranchFormItem>) => {
    setBranches((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  };

  const handleProvinceChange = (index: number, tinhThanhId: string) => {
    updateBranch(index, { tinhThanhId, xaPhuongId: undefined });
    const id = Number(tinhThanhId);
    if (id > 0) void loadWards(id);
  };

  const handleSubmit = () => {
    const chiNhanhs: CreateAdminCompanyBranchPayload[] = branches.map(({ tinhThanhId: _, ...rest }) => rest);
    onSubmit({ ...form, chiNhanhs });
  };

  const title = editingCompany ? "Sửa thông tin công ty" : "Thêm công ty mới";

  return (
    <div className="fixed inset-0 z-70 flex items-start justify-center overflow-y-auto bg-slate-900/40 px-4 py-8">
      <div className="w-full max-w-xl rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>

        <div className="mt-4 space-y-3">
          {/* Thông tin công ty */}
          <div className="grid gap-1">
            <label className="text-xs font-medium text-slate-600">Tên công ty *</label>
            <input value={form.ten} onChange={(e) => setForm({ ...form, ten: e.target.value })} placeholder="Nhập tên công ty"
              className="h-9 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500" />
          </div>

          <div className="grid gap-1">
            <label className="text-xs font-medium text-slate-600">
              Mã số thuế *{editingCompany ? " (không thể thay đổi)" : ""}
            </label>
            <input value={form.maSoThue} onChange={(e) => setForm({ ...form, maSoThue: e.target.value })}
              placeholder="Nhập mã số thuế" disabled={!!editingCompany}
              className="h-9 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 disabled:cursor-not-allowed disabled:bg-slate-100" />
          </div>

          <div className="grid gap-1">
            <label className="text-xs font-medium text-slate-600">Website</label>
            <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..."
              className="h-9 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500" />
          </div>

          <div className="grid gap-1">
            <label className="text-xs font-medium text-slate-600">Mô tả</label>
            <textarea value={form.moTa} onChange={(e) => setForm({ ...form, moTa: e.target.value })}
              placeholder="Mô tả ngắn về công ty..." rows={2}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" />
          </div>

          {/* Danh sách chi nhánh — chỉ hiện khi tạo mới */}
          {!editingCompany ? (
            <>
              <hr className="border-slate-200" />
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Chi nhánh ({branches.length})
                </p>
                <Button variant="outline" size="sm" type="button" onClick={addBranch}>
                  + Thêm chi nhánh
                </Button>
              </div>

              <div className="space-y-3">
                {branches.map((branch, index) => {
                  const wardList = wardsByProvince[Number(branch.tinhThanhId)] ?? [];
                  const loadingWards = loadingWardIds.includes(Number(branch.tinhThanhId));

                  return (
                    <div key={index} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                          <input type="radio" name="truSoChinh" checked={branch.laTruSoChinh}
                            onChange={() => setMainBranch(index)} className="accent-slate-900" />
                          {branch.laTruSoChinh
                            ? <span className="font-semibold text-slate-900">Trụ sở chính</span>
                            : "Đặt làm trụ sở chính"}
                        </label>
                        {branches.length > 1 ? (
                          <Button variant="unstyled" type="button" onClick={() => removeBranch(index)}
                            className="text-xs text-rose-600">
                            Xoá
                          </Button>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <input value={branch.ten}
                          onChange={(e) => updateBranch(index, { ten: e.target.value })}
                          placeholder="Tên chi nhánh *"
                          className="h-8 w-full rounded border border-slate-300 px-2.5 text-xs outline-none focus:border-slate-500" />

                        <input value={branch.diaChiChiTiet}
                          onChange={(e) => updateBranch(index, { diaChiChiTiet: e.target.value })}
                          placeholder="Địa chỉ chi tiết (số nhà, đường...) *"
                          className="h-8 w-full rounded border border-slate-300 px-2.5 text-xs outline-none focus:border-slate-500" />

                        <div className="grid grid-cols-2 gap-2">
                          <select value={branch.tinhThanhId}
                            onChange={(e) => handleProvinceChange(index, e.target.value)}
                            className="h-8 w-full rounded border border-slate-300 px-2 text-xs outline-none focus:border-slate-500">
                            <option value="">Chọn tỉnh/thành</option>
                            {provinces.map((p) => (
                              <option key={p.id} value={p.id}>{p.ten}</option>
                            ))}
                          </select>

                          <select value={branch.xaPhuongId ?? ""}
                            disabled={!branch.tinhThanhId || loadingWards}
                            onChange={(e) => updateBranch(index, { xaPhuongId: e.target.value ? Number(e.target.value) : undefined })}
                            className="h-8 w-full rounded border border-slate-300 px-2 text-xs outline-none focus:border-slate-500 disabled:cursor-not-allowed disabled:bg-slate-100">
                            <option value="">
                              {!branch.tinhThanhId ? "Chọn tỉnh trước" : loadingWards ? "Đang tải..." : "Chọn phường/xã"}
                            </option>
                            {wardList.map((w) => (
                              <option key={w.id} value={w.id}>{w.ten}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" type="button" disabled={submitting} onClick={onClose}>
            Hủy
          </Button>
          <Button variant="primary" type="button" disabled={submitting} onClick={handleSubmit}>
            {submitting ? "Đang lưu..." : editingCompany ? "Lưu thay đổi" : "Thêm công ty"}
          </Button>
        </div>
      </div>
    </div>
  );
}

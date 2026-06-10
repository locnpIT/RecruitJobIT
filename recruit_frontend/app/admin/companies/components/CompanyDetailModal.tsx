"use client";

import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { locationService, type Province, type Ward } from "@/services/common/location.service";
import type { AdminCompanyDetail, AdminCompanyDetailBranch, UpdateAdminCompanyBranchPayload } from "@/services/admin/types";

type CompanyDetailModalProps = {
  company: AdminCompanyDetail;
  showReviewActions: boolean;
  isMutating: boolean;
  onClose: () => void;
  onCreateBranch: (payload: UpdateAdminCompanyBranchPayload) => Promise<boolean>;
  onUpdateBranch: (branchId: number, payload: UpdateAdminCompanyBranchPayload) => Promise<boolean>;
  onDeleteBranch: (branchId: number) => Promise<boolean>;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
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

export function CompanyDetailModal({
  company,
  showReviewActions,
  isMutating,
  onClose,
  onCreateBranch,
  onUpdateBranch,
  onDeleteBranch,
  onApprove,
  onReject,
}: CompanyDetailModalProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wardsByProvince, setWardsByProvince] = useState<Record<number, Ward[]>>({});
  const [loadingWardIds, setLoadingWardIds] = useState<number[]>([]);
  const [editingBranchId, setEditingBranchId] = useState<number | null>(null);
  const [branchForm, setBranchForm] = useState<BranchFormState>(EMPTY_BRANCH_FORM);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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

  const activeBranches = useMemo(
    () => company.chiNhanhs.filter((branch) => branch.trangThai !== "DELETED"),
    [company.chiNhanhs],
  );

  useEffect(() => {
    const preloadProvinceIds = Array.from(
      new Set(company.chiNhanhs.map((branch) => branch.tinhThanhId).filter((id): id is number => typeof id === "number" && id > 0)),
    );
    preloadProvinceIds.forEach((provinceId) => {
      if (wardsByProvince[provinceId] || loadingWardIds.includes(provinceId)) {
        return;
      }
      void loadWards(provinceId);
    });
  }, [company.chiNhanhs, loadWards, loadingWardIds, wardsByProvince]);

  const resetBranchEditor = () => {
    setEditingBranchId(null);
    setIsCreateOpen(false);
    setBranchForm(EMPTY_BRANCH_FORM);
  };

  const openCreateBranch = () => {
    resetBranchEditor();
    setIsCreateOpen(true);
  };

  const openEditBranch = (branch: AdminCompanyDetailBranch) => {
    if (branch.id == null) {
      toast.error("Không xác định được chi nhánh để sửa.");
      return;
    }
    setIsCreateOpen(false);
    setEditingBranchId(branch.id);
    setBranchForm(mapBranchToForm(branch));
    if (branch.tinhThanhId) {
      void loadWards(branch.tinhThanhId);
    }
  };

  const handleProvinceChange = (tinhThanhId: string) => {
    setBranchForm((prev) => ({
      ...prev,
      tinhThanhId,
      xaPhuongId: "",
    }));
    const safeProvinceId = Number(tinhThanhId);
    if (safeProvinceId > 0) {
      void loadWards(safeProvinceId);
    }
  };

  const handleSubmitBranch = async () => {
    const payload = buildBranchPayload(branchForm);
    if (!payload) {
      toast.error("Vui lòng nhập đủ thông tin chi nhánh.");
      return;
    }

    let success = false;
    if (isCreateOpen) {
      success = await onCreateBranch(payload);
    } else if (editingBranchId != null) {
      success = await onUpdateBranch(editingBranchId, payload);
    } else {
      return;
    }

    if (success) {
      resetBranchEditor();
    }
  };

  const handleDeleteBranch = async (branch: AdminCompanyDetailBranch) => {
    if (branch.id == null) {
      toast.error("Không xác định được chi nhánh để xoá.");
      return;
    }
    const confirmed = window.confirm(`Xoá chi nhánh "${branch.ten ?? "không tên"}"?`);
    if (!confirmed) {
      return;
    }
    const success = await onDeleteBranch(branch.id);
    if (success && editingBranchId === branch.id) {
      resetBranchEditor();
    }
  };

  const currentProvinceId = Number(branchForm.tinhThanhId);
  const wardOptions = currentProvinceId > 0 ? wardsByProvince[currentProvinceId] ?? [] : [];
  const isWardLoading = currentProvinceId > 0 && loadingWardIds.includes(currentProvinceId);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 px-4 py-10">
      <div className="w-full max-w-6xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Chi tiết công ty</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">{company.congTy.ten}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {company.congTy.maSoThue} · {company.congTy.trangThai}
            </p>
          </div>
          <Button
            variant="unstyled"
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center border border-slate-300 text-slate-700"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <Section title="Thông tin công ty">
              <InfoRow label="Website" value={company.congTy.website ?? "--"} />
              <InfoRow label="Trạng thái" value={company.congTy.trangThai ?? "--"} />
              <InfoRow label="Lý do từ chối" value={company.congTy.lyDoTuChoi ?? "--"} />
            </Section>

            <Section title="Chủ công ty">
              <InfoRow label="Họ tên" value={company.chuCongTy?.hoTen ?? "--"} />
              <InfoRow label="Email" value={company.chuCongTy?.email ?? "--"} />
              <InfoRow label="Số điện thoại" value={company.chuCongTy?.soDienThoai ?? "--"} />
              <InfoRow label="Hoạt động" value={company.chuCongTy?.dangHoatDong ? "Có" : "Không"} />
            </Section>

            <Section title="Chi nhánh">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-500">{activeBranches.length} chi nhánh đang hoạt động</p>
                {company.congTy.trangThai !== "DELETED" ? (
                  <Button variant="outline" size="sm" type="button" disabled={isMutating} onClick={openCreateBranch}>
                    <Plus className="mr-1 h-4 w-4" />
                    Thêm chi nhánh
                  </Button>
                ) : null}
              </div>

              {(isCreateOpen || editingBranchId != null) && company.congTy.trangThai !== "DELETED" ? (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {isCreateOpen ? "Thêm chi nhánh mới" : "Sửa chi nhánh"}
                    </p>
                    <Button variant="unstyled" type="button" disabled={isMutating} onClick={resetBranchEditor} className="text-xs text-slate-500">
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
                    <Button variant="outline" type="button" disabled={isMutating} onClick={resetBranchEditor}>
                      Hủy
                    </Button>
                    <Button variant="primary" type="button" disabled={isMutating} onClick={() => void handleSubmitBranch()}>
                      {isMutating ? "Đang lưu..." : isCreateOpen ? "Thêm chi nhánh" : "Lưu thay đổi"}
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="overflow-x-auto border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-normal">Tên</th>
                      <th className="px-3 py-2 font-normal">Địa chỉ</th>
                      <th className="px-3 py-2 font-normal">Phường/Xã</th>
                      <th className="px-3 py-2 font-normal">Tỉnh/Thành</th>
                      <th className="px-3 py-2 font-normal">Chính</th>
                      <th className="px-3 py-2 font-normal">Trạng thái</th>
                      <th className="px-3 py-2 text-right font-normal">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {company.chiNhanhs.map((branch) => {
                      const canMutateBranch = branch.id != null && branch.trangThai !== "DELETED" && company.congTy.trangThai !== "DELETED";
                      return (
                        <tr key={branch.id ?? branch.ten} className="border-b border-slate-100 align-top last:border-b-0">
                          <td className="px-3 py-3 font-medium text-slate-900">{branch.ten ?? "--"}</td>
                          <td className="px-3 py-3 text-slate-600">{branch.diaChiChiTiet ?? "--"}</td>
                          <td className="px-3 py-3 text-slate-600">{branch.xaPhuongTen ?? "--"}</td>
                          <td className="px-3 py-3 text-slate-600">{branch.tinhThanhTen ?? "--"}</td>
                          <td className="px-3 py-3 text-slate-600">{branch.laTruSoChinh ? "Có" : "Không"}</td>
                          <td className="px-3 py-3 text-slate-600">{branch.trangThai === "DELETED" ? "Đã xoá" : "Đang hoạt động"}</td>
                          <td className="px-3 py-3">
                            <div className="flex justify-end gap-2">
                              {canMutateBranch ? (
                                <>
                                  <Button
                                    variant="unstyled"
                                    type="button"
                                    disabled={isMutating}
                                    onClick={() => openEditBranch(branch)}
                                    className="inline-flex items-center gap-1 border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Sửa
                                  </Button>
                                  <Button
                                    variant="unstyled"
                                    type="button"
                                    disabled={isMutating}
                                    onClick={() => void handleDeleteBranch(branch)}
                                    className="inline-flex items-center gap-1 border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Xoá
                                  </Button>
                                </>
                              ) : (
                                <span className="text-xs text-slate-400">--</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>

          <div className="space-y-4">
            <Section title="Minh chứng">
              <div className="space-y-3">
                {company.taiLieuMinhChungs.length ? (
                  company.taiLieuMinhChungs.map((doc) => (
                    <div key={doc.id ?? doc.tenTep} className="border border-slate-200 px-3 py-3">
                      <p className="text-sm font-medium text-slate-900">{doc.tenTep ?? "--"}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {doc.loaiTaiLieu ?? "--"} · {doc.trangThai ?? "--"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{doc.lyDoTuChoi ?? ""}</p>
                      {doc.duongDanTep ? (
                        <a
                          href={doc.duongDanTep}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-xs text-blue-600 hover:underline"
                        >
                          Xem file
                        </a>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Không có minh chứng.</p>
                )}
              </div>
            </Section>

            <Section title="Thao tác">
              <div className="flex gap-2">
                {showReviewActions && company.congTy.trangThai !== "APPROVED" && company.congTy.trangThai !== "DELETED" ? (
                  <Button
                    variant="unstyled"
                    type="button"
                    disabled={isMutating}
                    onClick={() => void onApprove()}
                    className="flex-1 border border-emerald-300 px-3 py-2 text-sm font-medium text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Duyệt
                  </Button>
                ) : null}
                {showReviewActions && company.congTy.trangThai !== "REJECTED" && company.congTy.trangThai !== "DELETED" ? (
                  <Button
                    variant="unstyled"
                    type="button"
                    disabled={isMutating}
                    onClick={() => void onReject()}
                    className="flex-1 border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Từ chối
                  </Button>
                ) : null}
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[70%] text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}

function mapBranchToForm(branch: AdminCompanyDetailBranch): BranchFormState {
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

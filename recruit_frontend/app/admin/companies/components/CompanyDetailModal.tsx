"use client";

import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import type { AdminCompanyDetail, AdminCompanyDetailBranch, UpdateAdminCompanyBranchPayload } from "@/services/admin/types";
import { CompanyBranchFormModal } from "./CompanyBranchFormModal";

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
  const [editingBranch, setEditingBranch] = useState<AdminCompanyDetailBranch | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const activeBranches = useMemo(
    () => company.chiNhanhs.filter((branch) => branch.trangThai !== "DELETED"),
    [company.chiNhanhs],
  );

  const resetBranchEditor = () => {
    setEditingBranch(null);
    setIsCreateOpen(false);
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
    setEditingBranch(branch);
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
    if (success && editingBranch?.id === branch.id) {
      resetBranchEditor();
    }
  };

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

              {(isCreateOpen || editingBranch != null) && company.congTy.trangThai !== "DELETED" ? (
                <CompanyBranchFormModal
                  key={isCreateOpen ? "create-branch" : `edit-branch-${editingBranch?.id ?? "unknown"}`}
                  branch={editingBranch}
                  isCreating={isCreateOpen}
                  isMutating={isMutating}
                  onClose={resetBranchEditor}
                  onCreateBranch={onCreateBranch}
                  onUpdateBranch={onUpdateBranch}
                />
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[70%] text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}

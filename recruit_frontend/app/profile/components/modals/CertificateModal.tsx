"use client";

import { useMemo, useState } from "react";
import type { CandidateCertificateItem, CandidateProfileMetadata } from "@/services/candidate-profile.service";
import { ProfileModal } from "./ProfileModal";
import { ProfileModalTabs, type ProfileModalTab } from "./ProfileModalTabs";
import { ProofStatusPill } from "../ProofStatusPill";
import { ProfileActionButton } from "../ProfileActionButton";

type CertificateFormState = {
  loaiChungChiId: string;
  tenChungChi: string;
  ngayBatDau: string;
  ngayHetHan: string;
  duongDanTep: string;
};

const EMPTY_FORM: CertificateFormState = {
  loaiChungChiId: "",
  tenChungChi: "",
  ngayBatDau: "",
  ngayHetHan: "",
  duongDanTep: "",
};

export function CertificateModal({
  open,
  items,
  metadata,
  submitting,
  uploadingProof,
  editingItem,
  onClose,
  onEdit,
  onUploadProof,
  onCreate,
  onUpdate,
  onDelete,
  onToggleSelection,
}: {
  open: boolean;
  items: CandidateCertificateItem[];
  metadata: CandidateProfileMetadata | null;
  submitting: boolean;
  uploadingProof: boolean;
  editingItem: CandidateCertificateItem | null;
  onClose: () => void;
  onEdit: (item: CandidateCertificateItem) => void;
  onUploadProof: (file: File) => Promise<string>;
  onCreate: (payload: CertificateFormState) => Promise<CandidateCertificateItem | null>;
  onUpdate: (certificateId: number, payload: CertificateFormState) => Promise<CandidateCertificateItem | null>;
  onDelete: (item: CandidateCertificateItem) => void;
  onToggleSelection: (item: CandidateCertificateItem) => void;
}) {
  const [tab, setTab] = useState<ProfileModalTab>("create");
  const [query, setQuery] = useState("");
  const initialForm = useMemo<CertificateFormState>(() => {
    if (!editingItem) {
      return EMPTY_FORM;
    }
    return {
      loaiChungChiId: editingItem.loaiChungChiId ? String(editingItem.loaiChungChiId) : "",
      tenChungChi: editingItem.tenChungChi,
      ngayBatDau: editingItem.ngayBatDau ?? "",
      ngayHetHan: editingItem.ngayHetHan ?? "",
      duongDanTep: editingItem.duongDanTep ?? "",
    };
  }, [editingItem]);
  const [form, setForm] = useState<CertificateFormState>(initialForm);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return items;
    }
    return items.filter((item) => {
      const haystack = `${item.tenChungChi} ${item.loaiChungChiTen ?? ""}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [items, query]);

  const title = editingItem ? "Sửa chứng chỉ" : "Thêm chứng chỉ";
  const description = editingItem
    ? "Cập nhật chứng chỉ. Thay đổi sẽ ảnh hưởng đến các hồ sơ đang chọn chứng chỉ này."
    : "Tạo mới hoặc chọn chứng chỉ có sẵn để hiển thị trong hồ sơ hiện tại.";

  return (
    <ProfileModal open={open} title={title} description={description} onClose={onClose}>
      {editingItem ? null : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ProfileModalTabs value={tab} onChange={setTab} />
          {tab === "pick" ? (
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên, loại chứng chỉ..."
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm sm:w-72"
            />
          ) : null}
        </div>
      )}

      {tab === "pick" && !editingItem ? (
        <div className="mt-5 space-y-2">
          {filteredItems.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              Không tìm thấy chứng chỉ phù hợp.
            </div>
          ) : null}
          {filteredItems.map((item) => {
            const dateRange = [item.ngayBatDau, item.ngayHetHan].filter(Boolean).join(" - ");
            return (
              <div key={item.id} className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{item.tenChungChi}</p>
                    <p className="mt-0.5 text-xs text-slate-600">{item.loaiChungChiTen ?? "Không rõ loại"}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      {dateRange ? <span>{dateRange}</span> : null}
                      <ProofStatusPill value={item.trangThai} />
                      {item.duongDanTep ? (
                        <a href={item.duongDanTep} target="_blank" rel="noreferrer" className="underline">
                          Xem minh chứng
                        </a>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ProfileActionButton
                      type="button"
                      variant="muted"
                      onClick={() => onEdit(item)}
                      className="px-3 py-2 text-xs"
                    >
                      Sửa
                    </ProfileActionButton>
                    <ProfileActionButton
                      type="button"
                      variant={item.duocChon ? "muted" : "primary"}
                      onClick={() => onToggleSelection(item)}
                      className="px-3 py-2 text-xs"
                    >
                      {item.duocChon ? "Ẩn khỏi hồ sơ" : "Thêm vào hồ sơ"}
                    </ProfileActionButton>
                    <ProfileActionButton
                      type="button"
                      variant="danger"
                      onClick={() => onDelete(item)}
                      className="px-3 py-2 text-xs"
                    >
                      Xoá
                    </ProfileActionButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <div className="grid gap-2">
            <select
              value={form.loaiChungChiId}
              onChange={(e) => setForm((prev) => ({ ...prev, loaiChungChiId: e.target.value }))}
              className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            >
              <option value="">Chọn loại chứng chỉ *</option>
              {metadata?.loaiChungChis?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.ten}
                </option>
              ))}
            </select>
            <input
              placeholder="Tên chứng chỉ *"
              value={form.tenChungChi}
              onChange={(e) => setForm((prev) => ({ ...prev, tenChungChi: e.target.value }))}
              className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <label className="text-xs font-medium text-slate-600">Ngày cấp</label>
              <input
                type="date"
                value={form.ngayBatDau}
                onChange={(e) => setForm((prev) => ({ ...prev, ngayBatDau: e.target.value }))}
                className="h-10 rounded-md border border-slate-300 px-3 text-sm"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-medium text-slate-600">Ngày hết hạn</label>
              <input
                type="date"
                value={form.ngayHetHan}
                onChange={(e) => setForm((prev) => ({ ...prev, ngayHetHan: e.target.value }))}
                className="h-10 rounded-md border border-slate-300 px-3 text-sm"
              />
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                <svg viewBox="0 0 20 20" fill="none" className="mr-1.5 h-4 w-4" aria-hidden="true">
                  <path
                    d="M10 13V4m0 0 3 3m-3-3L7 7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4 13.5v1A1.5 1.5 0 0 0 5.5 16h9a1.5 1.5 0 0 0 1.5-1.5v-1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                {uploadingProof ? "Đang tải minh chứng..." : "Tải minh chứng"}
                <input
                  type="file"
                  className="hidden"
                  disabled={uploadingProof}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) {
                      return;
                    }
                    void (async () => {
                      const uploaded = await onUploadProof(file);
                      setForm((prev) => ({ ...prev, duongDanTep: uploaded }));
                    })();
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

          <div className="flex flex-wrap items-center justify-end gap-2">
            <ProfileActionButton type="button" variant="muted" onClick={onClose} disabled={submitting}>
              Hủy
            </ProfileActionButton>
            <ProfileActionButton
              type="button"
              disabled={submitting}
              onClick={() => {
                void (async () => {
                  const result = editingItem
                    ? await onUpdate(editingItem.id, form)
                    : await onCreate(form);
                  if (result) {
                    onClose();
                  }
                })();
              }}
            >
              {submitting ? "Đang lưu..." : editingItem ? "Lưu thay đổi" : "Thêm chứng chỉ"}
            </ProfileActionButton>
          </div>
        </div>
      )}
    </ProfileModal>
  );
}

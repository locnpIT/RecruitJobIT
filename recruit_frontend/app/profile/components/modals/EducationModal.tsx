"use client";

import { useMemo, useState } from "react";
import type { CandidateEducationItem } from "@/services/candidate/candidate-profile.service";
import { ProfileModal } from "./ProfileModal";
import { ProfileModalTabs, type ProfileModalTab } from "./ProfileModalTabs";
import { ProofUploadBox } from "./ProofUploadBox";
import type { EducationFormState } from "./profileFormTypes";
import { ProofStatusPill } from "../ProofStatusPill";
import { ProfileActionButton } from "../ProfileActionButton";

const EMPTY_FORM: EducationFormState = {
  tenTruong: "",
  chuyenNganh: "",
  bacHoc: "",
  thoiGianBatDau: "",
  thoiGianKetThuc: "",
  duongDanTep: "",
};

export function EducationModal({
  open,
  items,
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
  items: CandidateEducationItem[];
  submitting: boolean;
  uploadingProof: boolean;
  editingItem: CandidateEducationItem | null;
  onClose: () => void;
  onEdit: (item: CandidateEducationItem) => void;
  onUploadProof: (file: File) => Promise<string>;
  onCreate: (payload: EducationFormState) => Promise<CandidateEducationItem | null>;
  onUpdate: (educationId: number, payload: EducationFormState) => Promise<CandidateEducationItem | null>;
  onDelete: (item: CandidateEducationItem) => void;
  onToggleSelection: (item: CandidateEducationItem) => void;
}) {
  const [tab, setTab] = useState<ProfileModalTab>("create");
  const [query, setQuery] = useState("");
  const [proofError, setProofError] = useState("");
  const initialForm = useMemo<EducationFormState>(() => {
    if (!editingItem) {
      return EMPTY_FORM;
    }
    return {
      tenTruong: editingItem.tenTruong,
      chuyenNganh: editingItem.chuyenNganh ?? "",
      bacHoc: editingItem.bacHoc ?? "",
      thoiGianBatDau: editingItem.thoiGianBatDau ?? "",
      thoiGianKetThuc: editingItem.thoiGianKetThuc ?? "",
      duongDanTep: editingItem.duongDanTep ?? "",
    };
  }, [editingItem]);
  const [form, setForm] = useState<EducationFormState>(initialForm);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return items;
    }
    return items.filter((item) => {
      const haystack = `${item.tenTruong} ${item.bacHoc ?? ""} ${item.chuyenNganh ?? ""}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [items, query]);

  const title = editingItem ? "Sửa học vấn" : "Thêm học vấn";
  const description = editingItem
    ? "Cập nhật thông tin học vấn. Thay đổi sẽ ảnh hưởng đến các hồ sơ đang chọn học vấn này."
    : "Tạo mới hoặc chọn học vấn có sẵn để hiển thị trong hồ sơ hiện tại.";

  const validateProof = () => {
    if (!form.duongDanTep) {
      setProofError("Vui lòng upload minh chứng");
      return false;
    }
    setProofError("");
    return true;
  };

  return (
    <ProfileModal open={open} title={title} description={description} onClose={onClose}>
      {editingItem ? null : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ProfileModalTabs value={tab} onChange={setTab} />
          {tab === "pick" ? (
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên trường..."
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm sm:w-72"
            />
          ) : null}
        </div>
      )}

      {tab === "pick" && !editingItem ? (
        <div className="mt-5 space-y-2">
          {filteredItems.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              Không tìm thấy học vấn phù hợp.
            </div>
          ) : null}
          {filteredItems.map((item) => {
            const dateRange = [item.thoiGianBatDau, item.thoiGianKetThuc].filter(Boolean).join(" - ");
            return (
              <div key={item.id} className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{item.tenTruong}</p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {[item.bacHoc, item.chuyenNganh].filter(Boolean).join(" • ") || "Chưa cập nhật"}
                    </p>
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
            <input
              placeholder="Tên trường *"
              value={form.tenTruong}
              onChange={(e) => setForm((prev) => ({ ...prev, tenTruong: e.target.value }))}
              className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            />
            <input
              placeholder="Chuyên ngành"
              value={form.chuyenNganh}
              onChange={(e) => setForm((prev) => ({ ...prev, chuyenNganh: e.target.value }))}
              className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            />
            <input
              placeholder="Bậc học"
              value={form.bacHoc}
              onChange={(e) => setForm((prev) => ({ ...prev, bacHoc: e.target.value }))}
              className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <label className="text-xs font-medium text-slate-600">Từ ngày</label>
              <input
                type="date"
                value={form.thoiGianBatDau}
                onChange={(e) => setForm((prev) => ({ ...prev, thoiGianBatDau: e.target.value }))}
                className="h-10 rounded-md border border-slate-300 px-3 text-sm"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-medium text-slate-600">Đến ngày</label>
              <input
                type="date"
                value={form.thoiGianKetThuc}
                onChange={(e) => setForm((prev) => ({ ...prev, thoiGianKetThuc: e.target.value }))}
                className="h-10 rounded-md border border-slate-300 px-3 text-sm"
              />
            </div>
          </div>

          <ProofUploadBox
            value={form.duongDanTep}
            error={proofError}
            uploading={uploadingProof}
            onUpload={onUploadProof}
            onChange={(uploaded) => setForm((prev) => ({ ...prev, duongDanTep: uploaded }))}
            onClearError={() => setProofError("")}
          />

          <div className="flex flex-wrap items-center justify-end gap-2">
            <ProfileActionButton type="button" variant="muted" onClick={onClose} disabled={submitting}>
              Hủy
            </ProfileActionButton>
            <ProfileActionButton
              type="button"
              disabled={submitting}
              onClick={() => {
                void (async () => {
                  if (!validateProof()) {
                    return;
                  }
                  const result = editingItem
                    ? await onUpdate(editingItem.id, form)
                    : await onCreate(form);
                  if (result) {
                    onClose();
                  }
                })();
              }}
            >
              {submitting ? "Đang lưu..." : editingItem ? "Lưu thay đổi" : "Thêm học vấn"}
            </ProfileActionButton>
          </div>
        </div>
      )}
    </ProfileModal>
  );
}

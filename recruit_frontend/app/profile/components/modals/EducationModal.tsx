"use client";

import { useMemo, useState } from "react";
import type { CandidateEducationItem } from "@/services/candidate/candidate-profile.service";
import { useProfileCrudState } from "../../hooks/useProfileCrudState";
import { ProfilePickListCard, ProfilePickListWrapper } from "../ProfilePickListCard";
import { ProfileModal } from "./ProfileModal";
import { ProfileModalTabs } from "./ProfileModalTabs";
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
  const { tab, setTab, query, setQuery, filteredItems } = useProfileCrudState(
    items,
    (item, q) => `${item.tenTruong} ${item.bacHoc ?? ""} ${item.chuyenNganh ?? ""}`.toLowerCase().includes(q)
  );
  const [proofError, setProofError] = useState("");

  const initialForm = useMemo<EducationFormState>(() => {
    if (!editingItem) return EMPTY_FORM;
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

  const title = editingItem ? "Sửa học vấn" : "Thêm học vấn";
  const description = editingItem
    ? "Cập nhật thông tin học vấn. Thay đổi sẽ ảnh hưởng đến các hồ sơ đang chọn học vấn này."
    : "Tạo mới hoặc chọn học vấn có sẵn để hiển thị trong hồ sơ hiện tại.";

  const validateProof = () => {
    if (!form.duongDanTep) { setProofError("Vui lòng upload minh chứng"); return false; }
    setProofError("");
    return true;
  };

  return (
    <ProfileModal open={open} title={title} description={description} onClose={onClose}>
      {!editingItem ? (
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
      ) : null}

      {tab === "pick" && !editingItem ? (
        <EducationPickList items={filteredItems} onEdit={onEdit} onDelete={onDelete} onToggleSelection={onToggleSelection} />
      ) : (
        <EducationForm
          form={form}
          submitting={submitting}
          uploadingProof={uploadingProof}
          proofError={proofError}
          editingItem={editingItem}
          onUploadProof={onUploadProof}
          onChange={setForm}
          onClearProofError={() => setProofError("")}
          onClose={onClose}
          onSave={() => {
            void (async () => {
              if (!validateProof()) return;
              const result = editingItem ? await onUpdate(editingItem.id, form) : await onCreate(form);
              if (result) onClose();
            })();
          }}
        />
      )}
    </ProfileModal>
  );
}

// --- Private sub-components ---

function EducationPickList({
  items,
  onEdit,
  onDelete,
  onToggleSelection,
}: {
  items: CandidateEducationItem[];
  onEdit: (item: CandidateEducationItem) => void;
  onDelete: (item: CandidateEducationItem) => void;
  onToggleSelection: (item: CandidateEducationItem) => void;
}) {
  return (
    <ProfilePickListWrapper isEmpty={items.length === 0} emptyMessage="Không tìm thấy học vấn phù hợp.">
      {items.map((item) => {
        const dateRange = [item.thoiGianBatDau, item.thoiGianKetThuc].filter(Boolean).join(" - ");
        return (
          <ProfilePickListCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} onToggleSelection={onToggleSelection}>
            <p className="text-sm font-semibold text-slate-950">{item.tenTruong}</p>
            <p className="mt-0.5 text-xs text-slate-600">
              {[item.bacHoc, item.chuyenNganh].filter(Boolean).join(" • ") || "Chưa cập nhật"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              {dateRange ? <span>{dateRange}</span> : null}
              <ProofStatusPill value={item.trangThai} />
              {item.duongDanTep ? (
                <a href={item.duongDanTep} target="_blank" rel="noreferrer" className="underline">Xem minh chứng</a>
              ) : null}
            </div>
          </ProfilePickListCard>
        );
      })}
    </ProfilePickListWrapper>
  );
}

function EducationForm({
  form,
  submitting,
  uploadingProof,
  proofError,
  editingItem,
  onUploadProof,
  onChange,
  onClearProofError,
  onClose,
  onSave,
}: {
  form: EducationFormState;
  submitting: boolean;
  uploadingProof: boolean;
  proofError: string;
  editingItem: CandidateEducationItem | null;
  onUploadProof: (file: File) => Promise<string>;
  onChange: (updater: (prev: EducationFormState) => EducationFormState) => void;
  onClearProofError: () => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="mt-5 space-y-3">
      <div className="grid gap-2">
        <input placeholder="Tên trường *" value={form.tenTruong} onChange={(e) => onChange((p) => ({ ...p, tenTruong: e.target.value }))} className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
        <input placeholder="Chuyên ngành" value={form.chuyenNganh} onChange={(e) => onChange((p) => ({ ...p, chuyenNganh: e.target.value }))} className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
        <input placeholder="Bậc học" value={form.bacHoc} onChange={(e) => onChange((p) => ({ ...p, bacHoc: e.target.value }))} className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1">
          <label className="text-xs font-medium text-slate-600">Từ ngày</label>
          <input
            type="date"
            value={form.thoiGianBatDau}
            max={form.thoiGianKetThuc || undefined}
            onChange={(e) => onChange((p) => ({ ...p, thoiGianBatDau: e.target.value }))}
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium text-slate-600">Đến ngày</label>
          <input
            type="date"
            value={form.thoiGianKetThuc}
            min={form.thoiGianBatDau || undefined}
            onChange={(e) => onChange((p) => ({ ...p, thoiGianKetThuc: e.target.value }))}
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
          />
        </div>
      </div>
      <ProofUploadBox
        value={form.duongDanTep}
        error={proofError}
        uploading={uploadingProof}
        onUpload={onUploadProof}
        onChange={(uploaded) => onChange((p) => ({ ...p, duongDanTep: uploaded }))}
        onClearError={onClearProofError}
      />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <ProfileActionButton type="button" variant="muted" onClick={onClose} disabled={submitting}>Hủy</ProfileActionButton>
        <ProfileActionButton type="button" disabled={submitting} onClick={onSave}>
          {submitting ? "Đang lưu..." : editingItem ? "Lưu thay đổi" : "Thêm học vấn"}
        </ProfileActionButton>
      </div>
    </div>
  );
}

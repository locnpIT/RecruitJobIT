"use client";

import { useMemo, useState } from "react";
import type { CandidateCertificateItem, CandidateProfileMetadata } from "@/services/candidate/candidate-profile.service";
import { useProfileCrudState } from "../../hooks/useProfileCrudState";
import { ProfilePickListCard, ProfilePickListWrapper } from "../ProfilePickListCard";
import { ProfileModal } from "./ProfileModal";
import { ProfileModalTabs } from "./ProfileModalTabs";
import { ProofUploadBox } from "./ProofUploadBox";
import type { CertificateFormState } from "./profileFormTypes";
import { ProofStatusPill } from "../ProofStatusPill";
import { ProfileActionButton } from "../ProfileActionButton";

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
  const { tab, setTab, query, setQuery, filteredItems } = useProfileCrudState(
    items,
    (item, q) => `${item.tenChungChi} ${item.loaiChungChiTen ?? ""}`.toLowerCase().includes(q)
  );
  const [proofError, setProofError] = useState("");

  const initialForm = useMemo<CertificateFormState>(() => {
    if (!editingItem) return EMPTY_FORM;
    return {
      loaiChungChiId: editingItem.loaiChungChiId ? String(editingItem.loaiChungChiId) : "",
      tenChungChi: editingItem.tenChungChi,
      ngayBatDau: editingItem.ngayBatDau ?? "",
      ngayHetHan: editingItem.ngayHetHan ?? "",
      duongDanTep: editingItem.duongDanTep ?? "",
    };
  }, [editingItem]);
  const [form, setForm] = useState<CertificateFormState>(initialForm);

  const title = editingItem ? "Sửa chứng chỉ" : "Thêm chứng chỉ";
  const description = editingItem
    ? "Cập nhật chứng chỉ. Thay đổi sẽ ảnh hưởng đến các hồ sơ đang chọn chứng chỉ này."
    : "Tạo mới hoặc chọn chứng chỉ có sẵn để hiển thị trong hồ sơ hiện tại.";

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
              placeholder="Tìm theo tên, loại chứng chỉ..."
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm sm:w-72"
            />
          ) : null}
        </div>
      ) : null}

      {tab === "pick" && !editingItem ? (
        <CertificatePickList items={filteredItems} onEdit={onEdit} onDelete={onDelete} onToggleSelection={onToggleSelection} />
      ) : (
        <CertificateForm
          form={form}
          metadata={metadata}
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

function CertificatePickList({
  items,
  onEdit,
  onDelete,
  onToggleSelection,
}: {
  items: CandidateCertificateItem[];
  onEdit: (item: CandidateCertificateItem) => void;
  onDelete: (item: CandidateCertificateItem) => void;
  onToggleSelection: (item: CandidateCertificateItem) => void;
}) {
  return (
    <ProfilePickListWrapper isEmpty={items.length === 0} emptyMessage="Không tìm thấy chứng chỉ phù hợp.">
      {items.map((item) => {
        const dateRange = [item.ngayBatDau, item.ngayHetHan].filter(Boolean).join(" - ");
        return (
          <ProfilePickListCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} onToggleSelection={onToggleSelection}>
            <p className="text-sm font-semibold text-slate-950">{item.tenChungChi}</p>
            <p className="mt-0.5 text-xs text-slate-600">{item.loaiChungChiTen ?? "Không rõ loại"}</p>
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

function CertificateForm({
  form,
  metadata,
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
  form: CertificateFormState;
  metadata: CandidateProfileMetadata | null;
  submitting: boolean;
  uploadingProof: boolean;
  proofError: string;
  editingItem: CandidateCertificateItem | null;
  onUploadProof: (file: File) => Promise<string>;
  onChange: (form: CertificateFormState) => void;
  onClearProofError: () => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="mt-5 space-y-3">
      <div className="grid gap-2">
        <select value={form.loaiChungChiId} onChange={(e) => onChange({ ...form, loaiChungChiId: e.target.value })} className="h-10 rounded-md border border-slate-300 px-3 text-sm">
          <option value="">Chọn loại chứng chỉ *</option>
          {metadata?.loaiChungChis?.map((item) => (
            <option key={item.id} value={item.id}>{item.ten}</option>
          ))}
        </select>
        <input placeholder="Tên chứng chỉ *" value={form.tenChungChi} onChange={(e) => onChange({ ...form, tenChungChi: e.target.value })} className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1">
          <label className="text-xs font-medium text-slate-600">Ngày cấp</label>
          <input
            type="date"
            value={form.ngayBatDau}
            max={form.ngayHetHan || undefined}
            onChange={(e) => onChange({ ...form, ngayBatDau: e.target.value })}
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium text-slate-600">Ngày hết hạn</label>
          <input
            type="date"
            value={form.ngayHetHan}
            min={form.ngayBatDau || undefined}
            onChange={(e) => onChange({ ...form, ngayHetHan: e.target.value })}
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
          />
        </div>
      </div>
      <ProofUploadBox
        value={form.duongDanTep}
        error={proofError}
        uploading={uploadingProof}
        onUpload={onUploadProof}
        onChange={(uploaded) => onChange({ ...form, duongDanTep: uploaded })}
        onClearError={onClearProofError}
      />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <ProfileActionButton type="button" variant="muted" onClick={onClose} disabled={submitting}>Hủy</ProfileActionButton>
        <ProfileActionButton type="button" disabled={submitting} onClick={onSave}>
          {submitting ? "Đang lưu..." : editingItem ? "Lưu thay đổi" : "Thêm chứng chỉ"}
        </ProfileActionButton>
      </div>
    </div>
  );
}

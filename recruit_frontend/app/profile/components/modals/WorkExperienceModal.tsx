"use client";

import { useMemo, useState } from "react";
import type { CandidateWorkExperienceItem } from "@/services/candidate/candidate-profile.service";
import { useProfileCrudState } from "../../hooks/useProfileCrudState";
import { ProfilePickListCard, ProfilePickListWrapper } from "../ProfilePickListCard";
import { ProfileModal } from "./ProfileModal";
import { ProfileModalTabs } from "./ProfileModalTabs";
import type { WorkExperienceFormState } from "./profileFormTypes";
import { ProfileActionButton } from "../ProfileActionButton";

const EMPTY_FORM: WorkExperienceFormState = {
  tenCongTy: "",
  chucDanh: "",
  moTaCongViec: "",
  thoiGianBatDau: "",
  thoiGianKetThuc: "",
};

export function WorkExperienceModal({
  open,
  items,
  submitting,
  editingItem,
  onClose,
  onEdit,
  onCreate,
  onUpdate,
  onDelete,
  onToggleSelection,
}: {
  open: boolean;
  items: CandidateWorkExperienceItem[];
  submitting: boolean;
  editingItem: CandidateWorkExperienceItem | null;
  onClose: () => void;
  onEdit: (item: CandidateWorkExperienceItem) => void;
  onCreate: (payload: WorkExperienceFormState) => Promise<CandidateWorkExperienceItem | null>;
  onUpdate: (experienceId: number, payload: WorkExperienceFormState) => Promise<CandidateWorkExperienceItem | null>;
  onDelete: (item: CandidateWorkExperienceItem) => void;
  onToggleSelection: (item: CandidateWorkExperienceItem) => void;
}) {
  const { tab, setTab, query, setQuery, filteredItems } = useProfileCrudState(
    items,
    (item, q) => `${item.tenCongTy} ${item.chucDanh ?? ""}`.toLowerCase().includes(q)
  );

  const initialForm = useMemo<WorkExperienceFormState>(() => {
    if (!editingItem) return EMPTY_FORM;
    return {
      tenCongTy: editingItem.tenCongTy,
      chucDanh: editingItem.chucDanh ?? "",
      moTaCongViec: editingItem.moTaCongViec ?? "",
      thoiGianBatDau: editingItem.thoiGianBatDau ?? "",
      thoiGianKetThuc: editingItem.thoiGianKetThuc ?? "",
    };
  }, [editingItem]);
  const [form, setForm] = useState<WorkExperienceFormState>(initialForm);

  const title = editingItem ? "Sửa kinh nghiệm làm việc" : "Thêm kinh nghiệm làm việc";
  const description = editingItem
    ? "Cập nhật kinh nghiệm làm việc. Thay đổi sẽ ảnh hưởng đến các hồ sơ đang chọn kinh nghiệm này."
    : "Tạo mới hoặc chọn kinh nghiệm có sẵn để hiển thị trong hồ sơ hiện tại.";

  return (
    <ProfileModal open={open} title={title} description={description} onClose={onClose}>
      {!editingItem ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ProfileModalTabs value={tab} onChange={setTab} />
          {tab === "pick" ? (
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo công ty, chức danh..."
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm sm:w-72"
            />
          ) : null}
        </div>
      ) : null}

      {tab === "pick" && !editingItem ? (
        <WorkExperiencePickList
          items={filteredItems}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleSelection={onToggleSelection}
        />
      ) : (
        <WorkExperienceForm
          form={form}
          submitting={submitting}
          editingItem={editingItem}
          onChange={setForm}
          onClose={onClose}
          onSave={() => {
            void (async () => {
              const result = editingItem
                ? await onUpdate(editingItem.id, form)
                : await onCreate(form);
              if (result) onClose();
            })();
          }}
        />
      )}
    </ProfileModal>
  );
}

// --- Private sub-components ---

function WorkExperiencePickList({
  items,
  onEdit,
  onDelete,
  onToggleSelection,
}: {
  items: CandidateWorkExperienceItem[];
  onEdit: (item: CandidateWorkExperienceItem) => void;
  onDelete: (item: CandidateWorkExperienceItem) => void;
  onToggleSelection: (item: CandidateWorkExperienceItem) => void;
}) {
  return (
    <ProfilePickListWrapper isEmpty={items.length === 0} emptyMessage="Không tìm thấy kinh nghiệm phù hợp.">
      {items.map((item) => {
        const dateRange = [item.thoiGianBatDau, item.thoiGianKetThuc].filter(Boolean).join(" - ");
        return (
          <ProfilePickListCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} onToggleSelection={onToggleSelection}>
            <p className="text-sm font-semibold text-slate-950">{item.tenCongTy}</p>
            <p className="mt-0.5 text-xs text-slate-600">{item.chucDanh || "Chưa cập nhật chức danh"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              {dateRange ? <span>{dateRange}</span> : null}
              {item.moTaCongViec ? <span className="text-slate-500">•</span> : null}
              {item.moTaCongViec ? <span className="line-clamp-1 max-w-lg">{item.moTaCongViec}</span> : null}
            </div>
          </ProfilePickListCard>
        );
      })}
    </ProfilePickListWrapper>
  );
}

function WorkExperienceForm({
  form,
  submitting,
  editingItem,
  onChange,
  onClose,
  onSave,
}: {
  form: WorkExperienceFormState;
  submitting: boolean;
  editingItem: CandidateWorkExperienceItem | null;
  onChange: (form: WorkExperienceFormState) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="mt-5 space-y-3">
      <div className="grid gap-2">
        <input placeholder="Tên công ty *" value={form.tenCongTy} onChange={(e) => onChange({ ...form, tenCongTy: e.target.value })} className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
        <input placeholder="Chức danh" value={form.chucDanh} onChange={(e) => onChange({ ...form, chucDanh: e.target.value })} className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
        <textarea placeholder="Mô tả công việc" value={form.moTaCongViec} onChange={(e) => onChange({ ...form, moTaCongViec: e.target.value })} rows={4} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1">
          <label className="text-xs font-medium text-slate-600">Từ ngày</label>
          <input
            type="date"
            value={form.thoiGianBatDau}
            max={form.thoiGianKetThuc || undefined}
            onChange={(e) => onChange({ ...form, thoiGianBatDau: e.target.value })}
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium text-slate-600">Đến ngày</label>
          <input
            type="date"
            value={form.thoiGianKetThuc}
            min={form.thoiGianBatDau || undefined}
            onChange={(e) => onChange({ ...form, thoiGianKetThuc: e.target.value })}
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <ProfileActionButton type="button" variant="muted" onClick={onClose} disabled={submitting}>Hủy</ProfileActionButton>
        <ProfileActionButton type="button" disabled={submitting} onClick={onSave}>
          {submitting ? "Đang lưu..." : editingItem ? "Lưu thay đổi" : "Thêm kinh nghiệm"}
        </ProfileActionButton>
      </div>
    </div>
  );
}

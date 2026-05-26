"use client";

import { useMemo, useState } from "react";
import type { CandidateWorkExperienceItem } from "@/services/candidate-profile.service";
import { ProfileModal } from "./ProfileModal";
import { ProfileModalTabs, type ProfileModalTab } from "./ProfileModalTabs";
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
  const [tab, setTab] = useState<ProfileModalTab>("create");
  const [query, setQuery] = useState("");
  const initialForm = useMemo<WorkExperienceFormState>(() => {
    if (!editingItem) {
      return EMPTY_FORM;
    }
    return {
      tenCongTy: editingItem.tenCongTy,
      chucDanh: editingItem.chucDanh ?? "",
      moTaCongViec: editingItem.moTaCongViec ?? "",
      thoiGianBatDau: editingItem.thoiGianBatDau ?? "",
      thoiGianKetThuc: editingItem.thoiGianKetThuc ?? "",
    };
  }, [editingItem]);
  const [form, setForm] = useState<WorkExperienceFormState>(initialForm);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return items;
    }
    return items.filter((item) => {
      const haystack = `${item.tenCongTy} ${item.chucDanh ?? ""}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [items, query]);

  const title = editingItem ? "Sửa kinh nghiệm làm việc" : "Thêm kinh nghiệm làm việc";
  const description = editingItem
    ? "Cập nhật kinh nghiệm làm việc. Thay đổi sẽ ảnh hưởng đến các hồ sơ đang chọn kinh nghiệm này."
    : "Tạo mới hoặc chọn kinh nghiệm có sẵn để hiển thị trong hồ sơ hiện tại.";

  return (
    <ProfileModal
      open={open}
      title={title}
      description={description}
      onClose={onClose}
    >
      {editingItem ? null : (
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
      )}

      {tab === "pick" && !editingItem ? (
        <div className="mt-5 space-y-2">
          {filteredItems.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              Không tìm thấy kinh nghiệm phù hợp.
            </div>
          ) : null}
          {filteredItems.map((item) => {
            const dateRange = [item.thoiGianBatDau, item.thoiGianKetThuc].filter(Boolean).join(" - ");
            return (
              <div key={item.id} className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{item.tenCongTy}</p>
                    <p className="mt-0.5 text-xs text-slate-600">{item.chucDanh || "Chưa cập nhật chức danh"}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      {dateRange ? <span>{dateRange}</span> : null}
                      {item.moTaCongViec ? <span className="text-slate-500">•</span> : null}
                      {item.moTaCongViec ? <span className="line-clamp-1 max-w-[32rem]">{item.moTaCongViec}</span> : null}
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
              placeholder="Tên công ty *"
              value={form.tenCongTy}
              onChange={(e) => setForm((prev) => ({ ...prev, tenCongTy: e.target.value }))}
              className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            />
            <input
              placeholder="Chức danh"
              value={form.chucDanh}
              onChange={(e) => setForm((prev) => ({ ...prev, chucDanh: e.target.value }))}
              className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            />
            <textarea
              placeholder="Mô tả công việc"
              value={form.moTaCongViec}
              onChange={(e) => setForm((prev) => ({ ...prev, moTaCongViec: e.target.value }))}
              rows={4}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
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

          <div className="flex flex-wrap items-center justify-end gap-2">
            <ProfileActionButton
              type="button"
              variant="muted"
              onClick={onClose}
              disabled={submitting}
            >
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
              {submitting ? "Đang lưu..." : editingItem ? "Lưu thay đổi" : "Thêm kinh nghiệm"}
            </ProfileActionButton>
          </div>
        </div>
      )}
    </ProfileModal>
  );
}

import { useState } from "react";
import type { CandidateWorkExperienceItem } from "@/services/candidate/candidate-profile.service";
import { ProfileActionButton } from "./ProfileActionButton";
import { WorkExperienceModal } from "./modals/WorkExperienceModal";
import type { WorkExperienceFormState } from "./modals/profileFormTypes";

export function WorkExperiencePanel({
  submitting,
  items,
  onCreate,
  onUpdate,
  onDelete,
  onToggleSelection,
}: {
  submitting: boolean;
  items: CandidateWorkExperienceItem[];
  onCreate: (payload: WorkExperienceFormState) => Promise<CandidateWorkExperienceItem | null>;
  onUpdate: (experienceId: number, payload: WorkExperienceFormState) => Promise<CandidateWorkExperienceItem | null>;
  onDelete: (item: CandidateWorkExperienceItem) => void;
  onToggleSelection: (item: CandidateWorkExperienceItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CandidateWorkExperienceItem | null>(null);

  return (
    <>
      <article className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Kinh nghiệm làm việc</h3>
            <p className="mt-1 text-xs text-slate-500">
              Thêm hoặc chọn lại kinh nghiệm đã có để hiển thị trong hồ sơ.
            </p>
          </div>
          <ProfileActionButton
            type="button"
            onClick={() => {
              setEditingItem(null);
              setOpen(true);
            }}
          >
            Thêm kinh nghiệm
          </ProfileActionButton>
        </div>

        <ul className="mt-4 space-y-2">
          {items.length === 0 ? (
            <li className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500">
              Chưa có kinh nghiệm làm việc nào.
            </li>
          ) : null}
          {items.map((item) => {
            const dateRange = [item.thoiGianBatDau, item.thoiGianKetThuc].filter(Boolean).join(" - ");
            return (
              <li key={item.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.tenCongTy}</p>
                    <p className="mt-0.5 text-xs text-slate-600">{item.chucDanh || "Chưa cập nhật chức danh"}</p>
                    {dateRange ? <p className="mt-1 text-xs text-slate-500">{dateRange}</p> : null}
                    {item.moTaCongViec ? (
                      <p className="mt-2 text-xs leading-5 text-slate-700">{item.moTaCongViec}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <ProfileActionButton
                      type="button"
                      variant="muted"
                      onClick={() => onToggleSelection(item)}
                      className="px-3 py-2 text-xs"
                    >
                      {item.duocChon ? "Ẩn khỏi hồ sơ" : "Hiển thị vào hồ sơ"}
                    </ProfileActionButton>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </article>

      {open ? (
        <WorkExperienceModal
          key={editingItem ? `edit-${editingItem.id}` : "create"}
          open={open}
          items={items}
          submitting={submitting}
          editingItem={editingItem}
          onClose={() => setOpen(false)}
          onEdit={(item) => {
            setEditingItem(item);
            setOpen(true);
          }}
          onCreate={onCreate}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onToggleSelection={onToggleSelection}
        />
      ) : null}
    </>
  );
}

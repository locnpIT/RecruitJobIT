import { useState } from "react";
import type { CandidateEducationItem } from "@/services/candidate-profile.service";
import { ProofStatusPill } from "./ProofStatusPill";
import { ProfileActionButton } from "./ProfileActionButton";
import { EducationModal } from "./modals/EducationModal";
import type { EducationFormState } from "./modals/profileFormTypes";

export function EducationPanel({
  submitting,
  uploadingProof,
  items,
  onCreate,
  onUpdate,
  onDelete,
  onToggleSelection,
  onUploadProof,
}: {
  submitting: boolean;
  uploadingProof: boolean;
  items: CandidateEducationItem[];
  onCreate: (payload: EducationFormState) => Promise<CandidateEducationItem | null>;
  onUpdate: (educationId: number, payload: EducationFormState) => Promise<CandidateEducationItem | null>;
  onDelete: (item: CandidateEducationItem) => void;
  onToggleSelection: (item: CandidateEducationItem) => void;
  onUploadProof: (file: File) => Promise<string>;
}) {
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CandidateEducationItem | null>(null);

  return (
    <>
      <article className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Học vấn</h3>
            <p className="mt-1 text-xs text-slate-500">Thêm hoặc chọn lại học vấn đã có để hiển thị trong hồ sơ.</p>
          </div>
          <ProfileActionButton
            type="button"
            onClick={() => {
              setEditingItem(null);
              setOpen(true);
            }}
          >
            Thêm học vấn
          </ProfileActionButton>
        </div>

        <ul className="mt-4 space-y-2">
          {items.length === 0 ? (
            <li className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500">
              Chưa có học vấn nào.
            </li>
          ) : null}
          {items.map((item) => {
            const dateRange = [item.thoiGianBatDau, item.thoiGianKetThuc].filter(Boolean).join(" - ");
            return (
              <li key={item.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.tenTruong}</p>
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
        <EducationModal
          key={editingItem ? `edit-${editingItem.id}` : "create"}
          open={open}
          items={items}
          submitting={submitting}
          uploadingProof={uploadingProof}
          editingItem={editingItem}
          onClose={() => setOpen(false)}
          onEdit={(item) => {
            setEditingItem(item);
            setOpen(true);
          }}
          onUploadProof={onUploadProof}
          onCreate={onCreate}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onToggleSelection={onToggleSelection}
        />
      ) : null}
    </>
  );
}

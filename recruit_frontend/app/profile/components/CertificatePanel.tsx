import { useState } from "react";
import type { CandidateCertificateItem, CandidateProfileMetadata } from "@/services/candidate-profile.service";
import { ProfileActionButton } from "./ProfileActionButton";
import { ProofStatusPill } from "./ProofStatusPill";
import { CertificateModal } from "./modals/CertificateModal";
import type { CertificateFormState } from "./modals/profileFormTypes";

export function CertificatePanel({
  metadata,
  submitting,
  uploadingProof,
  items,
  onCreate,
  onUpdate,
  onDelete,
  onToggleSelection,
  onUploadProof,
}: {
  metadata: CandidateProfileMetadata | null;
  submitting: boolean;
  uploadingProof: boolean;
  items: CandidateCertificateItem[];
  onCreate: (payload: CertificateFormState) => Promise<CandidateCertificateItem | null>;
  onUpdate: (certificateId: number, payload: CertificateFormState) => Promise<CandidateCertificateItem | null>;
  onDelete: (item: CandidateCertificateItem) => void;
  onToggleSelection: (item: CandidateCertificateItem) => void;
  onUploadProof: (file: File) => Promise<string>;
}) {
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CandidateCertificateItem | null>(null);

  return (
    <>
      <article className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Chứng chỉ</h3>
            <p className="mt-1 text-xs text-slate-500">
              Thêm mới hoặc chọn chứng chỉ đã có để hiển thị trong hồ sơ.
            </p>
          </div>
          <ProfileActionButton
            type="button"
            onClick={() => {
              setEditingItem(null);
              setOpen(true);
            }}
          >
            Thêm chứng chỉ
          </ProfileActionButton>
        </div>

        <ul className="mt-4 space-y-2">
          {items.length === 0 ? (
            <li className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500">
              Chưa có chứng chỉ nào.
            </li>
          ) : null}
          {items.map((item) => {
            const dateRange = [item.ngayBatDau, item.ngayHetHan].filter(Boolean).join(" - ");
            return (
              <li key={item.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.tenChungChi}</p>
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
        <CertificateModal
          key={editingItem ? `edit-${editingItem.id}` : "create"}
          open={open}
          items={items}
          metadata={metadata}
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

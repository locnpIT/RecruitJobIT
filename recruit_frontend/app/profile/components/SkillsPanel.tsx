import { useState } from "react";
import type { CandidateProfileMetadata } from "@/services/candidate/candidate-profile.service";
import { ProfileActionButton } from "./ProfileActionButton";
import { ProfileOptionSelectionModal } from "./modals/ProfileOptionSelectionModal";

// Panel kỹ năng chỉ hiển thị các kỹ năng đã chọn; danh sách đầy đủ nằm trong modal chọn.
export function SkillsPanel({
  metadata,
  selectedSkillIds,
  saving,
  onSave,
}: {
  metadata: CandidateProfileMetadata | null;
  selectedSkillIds: number[];
  saving: boolean;
  onSave: (nextSkillIds: number[]) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const selectedCount = selectedSkillIds.length;
  const options = metadata?.kyNangs ?? [];
  const selectedSkills = options.filter((skill) => selectedSkillIds.includes(skill.id));

  return (
    <>
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Kỹ năng</h2>
            <p className="mt-1 text-sm text-slate-600">Chỉ hiển thị các kỹ năng đã chọn trong hồ sơ hiện tại.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-[#008080]">
              Đã chọn {selectedCount} kỹ năng
            </span>
            <ProfileActionButton type="button" onClick={() => setOpen(true)}>
              Chọn kỹ năng
            </ProfileActionButton>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap gap-2">
            {selectedSkills.length === 0 ? (
              <span className="text-sm text-slate-500">Chưa chọn kỹ năng nào.</span>
            ) : null}
            {selectedSkills.map((skill) => (
              <span
                key={skill.id}
                className="rounded-full border border-teal-100 bg-white px-3 py-1.5 text-sm font-medium text-slate-800"
              >
                {skill.ten}
              </span>
            ))}
          </div>
        </div>
      </section>

      {open ? (
        <ProfileOptionSelectionModal
          open={open}
          title="Chọn kỹ năng"
          description="Chọn các kỹ năng bạn muốn hiển thị trong hồ sơ hiện tại."
          searchPlaceholder="Tìm kỹ năng..."
          emptyText="Không tìm thấy kỹ năng phù hợp."
          options={options}
          selectedIds={selectedSkillIds}
          saving={saving}
          onClose={() => setOpen(false)}
          onSave={onSave}
        />
      ) : null}
    </>
  );
}

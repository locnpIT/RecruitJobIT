import type { CandidateProfileMetadata } from "@/services/candidate-profile.service";
import { ProfileActionButton } from "./ProfileActionButton";

// Panel chọn kỹ năng của ứng viên.
// Luồng lưu kỹ năng hiện tại là replace-all theo danh sách skill id đang được chọn trên UI.
export function SkillsPanel({
  metadata,
  selectedSkillIds,
  saving,
  onToggleSkill,
  onSave,
}: {
  metadata: CandidateProfileMetadata | null;
  selectedSkillIds: number[];
  saving: boolean;
  onToggleSkill: (skillId: number) => void;
  onSave: () => void;
}) {
  const selectedCount = selectedSkillIds.length;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Kỹ năng</h2>
          <p className="mt-1 text-sm text-slate-600">Chọn kỹ năng bạn đang có để nhà tuyển dụng lọc nhanh hồ sơ.</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          Đã chọn {selectedCount} kỹ năng
        </span>
      </div>

      <div className="mt-4 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap gap-2">
          {metadata?.kyNangs?.map((skill) => {
            const active = selectedSkillIds.includes(skill.id);
            return (
              <button
                key={skill.id}
                type="button"
                onClick={() => onToggleSkill(skill.id)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-500 hover:text-slate-900"
                }`}
              >
                {skill.ten}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-slate-500">Mẹo: Chọn đúng kỹ năng chính giúp hồ sơ được lọc chính xác hơn.</p>
        <ProfileActionButton type="button" onClick={onSave} disabled={saving}>
          {saving ? "Đang lưu..." : "Lưu kỹ năng"}
        </ProfileActionButton>
      </div>
    </section>
  );
}

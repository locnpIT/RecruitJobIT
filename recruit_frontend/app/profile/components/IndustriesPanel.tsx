import type { CandidateProfileMetadata } from "@/services/candidate-profile.service";
import { ProfileActionButton } from "./ProfileActionButton";

// Panel chọn ngành nghề quan tâm của ứng viên.
// Dữ liệu lưu theo dạng danh sách id, backend xử lý replace-all giống kỹ năng.
export function IndustriesPanel({
  metadata,
  selectedIndustryIds,
  saving,
  onToggleIndustry,
  onSave,
}: {
  metadata: CandidateProfileMetadata | null;
  selectedIndustryIds: number[];
  saving: boolean;
  onToggleIndustry: (industryId: number) => void;
  onSave: () => void;
}) {
  const selectedCount = selectedIndustryIds.length;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Ngành nghề quan tâm</h2>
          <p className="mt-1 text-sm text-slate-600">
            Chọn các lĩnh vực bạn muốn ứng tuyển để hệ thống và nhà tuyển dụng lọc hồ sơ chính xác hơn.
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          Đã chọn {selectedCount} ngành nghề
        </span>
      </div>

      <div className="mt-4 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap gap-2">
          {metadata?.nganhNghes?.map((industry) => {
            const active = selectedIndustryIds.includes(industry.id);
            return (
              <button
                key={industry.id}
                type="button"
                onClick={() => onToggleIndustry(industry.id)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-500 hover:text-slate-900"
                }`}
              >
                {industry.ten}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-slate-500">Mẹo: Chọn đúng ngành nghề giúp job matching và gợi ý việc làm chính xác hơn.</p>
        <ProfileActionButton type="button" onClick={onSave} disabled={saving}>
          {saving ? "Đang lưu..." : "Lưu ngành nghề"}
        </ProfileActionButton>
      </div>
    </section>
  );
}

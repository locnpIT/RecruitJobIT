import { useState } from "react";
import type { CandidateProfileMetadata } from "@/services/candidate-profile.service";
import { ProfileActionButton } from "./ProfileActionButton";
import { ProfileOptionSelectionModal } from "./modals/ProfileOptionSelectionModal";

// Panel ngành nghề chỉ hiển thị ngành đã chọn; danh sách đầy đủ nằm trong modal chọn.
export function IndustriesPanel({
  metadata,
  selectedIndustryIds,
  saving,
  onSave,
}: {
  metadata: CandidateProfileMetadata | null;
  selectedIndustryIds: number[];
  saving: boolean;
  onSave: (nextIndustryIds: number[]) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const selectedCount = selectedIndustryIds.length;
  const options = metadata?.nganhNghes ?? [];
  const selectedIndustries = options.filter((industry) => selectedIndustryIds.includes(industry.id));

  return (
    <>
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Ngành nghề quan tâm</h2>
            <p className="mt-1 text-sm text-slate-600">
              Chỉ hiển thị các ngành nghề bạn đang quan tâm trong hồ sơ hiện tại.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-[#008080]">
              Đã chọn {selectedCount} ngành nghề
            </span>
            <ProfileActionButton type="button" onClick={() => setOpen(true)}>
              Chọn ngành nghề
            </ProfileActionButton>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap gap-2">
            {selectedIndustries.length === 0 ? (
              <span className="text-sm text-slate-500">Chưa chọn ngành nghề nào.</span>
            ) : null}
            {selectedIndustries.map((industry) => (
              <span
                key={industry.id}
                className="rounded-full border border-teal-100 bg-white px-3 py-1.5 text-sm font-medium text-slate-800"
              >
                {industry.ten}
              </span>
            ))}
          </div>
        </div>
      </section>

      {open ? (
        <ProfileOptionSelectionModal
          open={open}
          title="Chọn ngành nghề quan tâm"
          description="Chọn các lĩnh vực bạn muốn ứng tuyển hoặc muốn hệ thống ưu tiên gợi ý."
          searchPlaceholder="Tìm ngành nghề..."
          emptyText="Không tìm thấy ngành nghề phù hợp."
          options={options}
          selectedIds={selectedIndustryIds}
          saving={saving}
          onClose={() => setOpen(false)}
          onSave={onSave}
        />
      ) : null}
    </>
  );
}

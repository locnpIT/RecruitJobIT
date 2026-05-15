import type { CompanyJobMetadataOption } from "@/services/company-admin.service";

type JobSkillsMultiSelectProps = {
  options: CompanyJobMetadataOption[];
  selectedIds: number[];
  onChange: (nextIds: number[]) => void;
};

// Multi-select kỹ năng cho form tạo/sửa tin tuyển dụng.
// Component này giữ phần UI chọn skill tách biệt khỏi modal để page/container dễ đọc hơn.
export function JobSkillsMultiSelect({ options, selectedIds, onChange }: JobSkillsMultiSelectProps) {
  const selectedSet = new Set(selectedIds);

  const handleToggle = (skillId: number) => {
    if (!Number.isFinite(skillId) || skillId <= 0) {
      return;
    }

    if (selectedSet.has(skillId)) {
      onChange(selectedIds.filter((id) => id !== skillId));
      return;
    }

    onChange([...selectedIds, skillId]);
  };

  return (
    <div className="space-y-3 rounded-md border border-slate-200 p-3">
      <div>
        <p className="text-sm font-medium text-slate-800">Kỹ năng yêu cầu</p>
        <p className="mt-1 text-xs text-slate-500">
          Chọn các kỹ năng cốt lõi mà ứng viên cần có cho vị trí này.
        </p>
      </div>

      <div className="max-h-44 overflow-y-auto rounded-md border border-slate-200">
        {!options.length ? (
          <p className="p-3 text-sm text-slate-500">Chưa có danh mục kỹ năng.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {options.map((option) => {
              const skillId = Number(option.id ?? 0);
              const checked = selectedSet.has(skillId);

              return (
                <li key={option.id ?? `skill-${option.ten}`} className="px-3 py-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggle(skillId)}
                    />
                    <span>{option.ten ?? "--"}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {selectedIds.length > 0 ? (
          selectedIds.map((selectedId) => {
            const selected = options.find((option) => Number(option.id ?? 0) === selectedId);
            return (
              <span
                key={`selected-skill-${selectedId}`}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
              >
                {selected?.ten ?? `Skill #${selectedId}`}
              </span>
            );
          })
        ) : (
          <p className="text-xs text-slate-500">Chưa chọn kỹ năng nào.</p>
        )}
      </div>
    </div>
  );
}

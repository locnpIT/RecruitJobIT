type JobSkillsPanelProps = {
  skills: string[];
};

// Hiển thị kỹ năng yêu cầu của tin tuyển dụng dạng chip.
// Tách component riêng để khối mô tả job không bị dài và dễ tái sử dụng sau này.
export function JobSkillsPanel({ skills }: JobSkillsPanelProps) {
  if (!skills.length) {
    return (
      <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Nhà tuyển dụng chưa khai báo kỹ năng yêu cầu.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <span
          key={skill}
          className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
        >
          {skill}
        </span>
      ))}
    </div>
  );
}

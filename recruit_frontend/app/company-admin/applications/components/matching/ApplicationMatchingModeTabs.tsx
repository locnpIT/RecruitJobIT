import { BriefcaseBusiness, ClipboardList, UsersRound } from "lucide-react";
import type { ApplicationMatchingMode } from "./types";

type ApplicationMatchingModeTabsProps = {
  value: ApplicationMatchingMode;
  onChange: (mode: ApplicationMatchingMode) => void;
};

const modes = [
  {
    value: "applications" as const,
    label: "Danh sách đơn",
    description: "Xem và xử lý các đơn ứng tuyển theo bộ lọc hiện tại.",
    icon: ClipboardList,
  },
  {
    value: "job-to-candidates" as const,
    label: "AI theo tin",
    description: "Xếp hạng ứng viên phù hợp với tin tuyển dụng đang chọn.",
    icon: BriefcaseBusiness,
  },
  {
    value: "candidate-to-jobs" as const,
    label: "AI theo ứng viên",
    description: "Xem các tin trong chi nhánh phù hợp với một ứng viên.",
    icon: UsersRound,
  },
];

export function ApplicationMatchingModeTabs({ value, onChange }: ApplicationMatchingModeTabsProps) {
  return (
    <div className="grid gap-2 lg:grid-cols-3">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = value === mode.value;

        return (
          <button
            key={mode.value}
            type="button"
            onClick={() => onChange(mode.value)}
            className={`rounded-md border px-3 py-3 text-left transition ${
              isActive
                ? "border-teal-300 bg-teal-50 text-teal-950"
                : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
            }`}
          >
            <div className="flex gap-3">
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${
                  isActive ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold">{mode.label}</span>
                <span className={`mt-1 block text-xs leading-5 ${isActive ? "text-teal-700" : "text-slate-500"}`}>
                  {mode.description}
                </span>
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

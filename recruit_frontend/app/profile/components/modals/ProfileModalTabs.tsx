 "use client";

import { cn } from "@/lib/utils";

export type ProfileModalTab = "create" | "pick";

export function ProfileModalTabs({
  value,
  onChange,
  createLabel = "Tạo mới",
  pickLabel = "Chọn có sẵn",
}: {
  value: ProfileModalTab;
  onChange: (next: ProfileModalTab) => void;
  createLabel?: string;
  pickLabel?: string;
}) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-sm">
      <button
        type="button"
        onClick={() => onChange("create")}
        className={cn(
          "h-9 rounded-md px-3 font-medium transition",
          value === "create" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-900"
        )}
      >
        {createLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange("pick")}
        className={cn(
          "h-9 rounded-md px-3 font-medium transition",
          value === "pick" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-900"
        )}
      >
        {pickLabel}
      </button>
    </div>
  );
}


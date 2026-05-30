"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { CandidateOptionItem } from "@/services/candidate/candidate-profile.service";
import { ProfileActionButton } from "../ProfileActionButton";
import { ProfileModal } from "./ProfileModal";

type ProfileOptionSelectionModalProps = {
  open: boolean;
  title: string;
  description: string;
  searchPlaceholder: string;
  emptyText: string;
  options: CandidateOptionItem[];
  selectedIds: number[];
  saving: boolean;
  onClose: () => void;
  onSave: (nextIds: number[]) => Promise<boolean>;
};

export function ProfileOptionSelectionModal({
  open,
  title,
  description,
  searchPlaceholder,
  emptyText,
  options,
  selectedIds,
  saving,
  onClose,
  onSave,
}: ProfileOptionSelectionModalProps) {
  const [query, setQuery] = useState("");
  const [draftIds, setDraftIds] = useState<number[]>(selectedIds);

  const selectedSet = useMemo(() => new Set(draftIds), [draftIds]);
  const selectedOptions = useMemo(
    () => options.filter((item) => selectedSet.has(item.id)),
    [options, selectedSet],
  );
  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return options;
    }
    return options.filter((item) => item.ten.toLowerCase().includes(normalized));
  }, [options, query]);

  const toggleOption = (optionId: number) => {
    setDraftIds((prev) => (prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]));
  };

  return (
    <ProfileModal open={open} title={title} description={description} onClose={onClose}>
      <div className="space-y-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-slate-500"
          />
        </label>

        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">Đã chọn</p>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
              {draftIds.length}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedOptions.length === 0 ? (
              <span className="text-sm text-slate-500">Chưa chọn mục nào.</span>
            ) : null}
            {selectedOptions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleOption(item.id)}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100"
              >
                {item.ten}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto rounded-md border border-slate-200 bg-white p-2">
          {filteredOptions.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              {emptyText}
            </div>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-2">
            {filteredOptions.map((item) => {
              const active = selectedSet.has(item.id);
              return (
                <Button
                  key={item.id}
                  type="button"
                  variant="unstyled"
                  onClick={() => toggleOption(item.id)}
                  className={cn(
                    "flex min-h-11 items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition",
                    active
                      ? "border-[#008080] bg-teal-50 text-slate-950"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  <span className="min-w-0 flex-1 break-words">{item.ten}</span>
                  {active ? (
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#008080] text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  ) : null}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <ProfileActionButton type="button" variant="muted" onClick={onClose} disabled={saving}>
            Hủy
          </ProfileActionButton>
          <ProfileActionButton
            type="button"
            disabled={saving}
            onClick={() => {
              void (async () => {
                const success = await onSave(draftIds);
                if (success) {
                  onClose();
                }
              })();
            }}
          >
            {saving ? "Đang lưu..." : "Lưu lựa chọn"}
          </ProfileActionButton>
        </div>
      </div>
    </ProfileModal>
  );
}

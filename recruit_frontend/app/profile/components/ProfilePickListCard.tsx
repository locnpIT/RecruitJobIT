"use client";

import type { ReactNode } from "react";
import { ProfileActionButton } from "./ProfileActionButton";

export function ProfilePickListCard<T extends { id: number; duocChon?: boolean }>({
  item,
  onEdit,
  onDelete,
  onToggleSelection,
  children,
}: {
  item: T;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onToggleSelection: (item: T) => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>{children}</div>
        <div className="flex flex-wrap gap-2">
          <ProfileActionButton type="button" variant="muted" onClick={() => onEdit(item)} className="px-3 py-2 text-xs">
            Sửa
          </ProfileActionButton>
          <ProfileActionButton
            type="button"
            variant={item.duocChon ? "muted" : "primary"}
            onClick={() => onToggleSelection(item)}
            className="px-3 py-2 text-xs"
          >
            {item.duocChon ? "Ẩn khỏi hồ sơ" : "Thêm vào hồ sơ"}
          </ProfileActionButton>
          <ProfileActionButton type="button" variant="danger" onClick={() => onDelete(item)} className="px-3 py-2 text-xs">
            Xoá
          </ProfileActionButton>
        </div>
      </div>
    </div>
  );
}

export function ProfilePickListWrapper({
  isEmpty,
  emptyMessage,
  children,
}: {
  isEmpty: boolean;
  emptyMessage: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-5 space-y-2">
      {isEmpty ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          {emptyMessage}
        </div>
      ) : null}
      {children}
    </div>
  );
}

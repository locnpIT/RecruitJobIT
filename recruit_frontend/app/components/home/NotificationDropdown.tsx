"use client";

import { type UIEvent } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { useHomeHeaderData } from "./hooks/useHomeHeaderData";

type NotificationData = Pick<
  ReturnType<typeof useHomeHeaderData>,
  | "latestNotifications"
  | "unreadCount"
  | "loadingNotifications"
  | "loadingMoreNotifications"
  | "notificationHasNext"
  | "markReadAndSync"
  | "deleteNotification"
  | "markAllRead"
>;

type NotificationDropdownProps = {
  open: boolean;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  data: NotificationData;
  onToggle: () => void;
  onClose: () => void;
  onScroll: (event: UIEvent<HTMLDivElement>) => void;
};

export function NotificationDropdown({
  open,
  dropdownRef,
  data,
  onToggle,
  onClose,
  onScroll,
}: NotificationDropdownProps) {
  const handleClickNotification = async (item: NotificationData["latestNotifications"][number]) => {
    try {
      await data.markReadAndSync(item);
    } catch {
      // Không chặn điều hướng nếu API markRead lỗi.
    }
    onClose();
    if (item.duongDan) {
      window.location.assign(item.duongDan);
    }
  };

  const handleDeleteNotification = async (item: NotificationData["latestNotifications"][number]) => {
    try {
      await data.deleteNotification(item);
    } catch {
      // ignore
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <Button
        type="button"
        variant="unstyled"
        onClick={onToggle}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-md p-0 text-slate-700 hover:bg-slate-100"
        aria-label="Mở thông báo"
      >
        <Bell className="h-5 w-5" />
        {data.unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-semibold text-white">
            {data.unreadCount > 99 ? "99+" : data.unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-sm font-semibold text-slate-900">Thông báo</p>
            <Button
              type="button"
              variant="unstyled"
              onClick={() => void data.markAllRead()}
              className="text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Đánh dấu đã đọc
            </Button>
          </div>
          <div className="max-h-96 overflow-y-auto" onScroll={onScroll}>
            {data.loadingNotifications ? (
              <p className="px-2 py-4 text-xs text-slate-500">Đang tải thông báo...</p>
            ) : null}
            {!data.loadingNotifications && data.latestNotifications.length === 0 ? (
              <p className="px-2 py-4 text-xs text-slate-500">Chưa có thông báo nào.</p>
            ) : null}
            {!data.loadingNotifications
              ? data.latestNotifications.map((item) => (
                  <div
                    key={item.id}
                    className={`mb-1 rounded-md border px-2 py-5 ${
                      item.daDoc ? "border-slate-200 bg-white" : "border-amber-200 bg-amber-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Button
                        type="button"
                        variant="unstyled"
                        onClick={() => void handleClickNotification(item)}
                        className="flex-1 text-left hover:bg-slate-50"
                      >
                        <p className="text-xs font-semibold text-slate-900">{item.tieuDe}</p>
                        <p className="mt-1 text-xs text-slate-600">{item.noiDung}</p>
                      </Button>
                      <Button
                        type="button"
                        variant="unstyled"
                        onClick={() => void handleDeleteNotification(item)}
                        className="rounded px-1.5 py-0.5 text-[11px] font-medium text-rose-700 hover:bg-rose-50"
                        aria-label="Xoá thông báo"
                      >
                        Xoá
                      </Button>
                    </div>
                  </div>
                ))
              : null}
            {data.loadingMoreNotifications ? (
              <p className="px-2 py-3 text-center text-xs text-slate-500">Đang tải thêm...</p>
            ) : null}
            {!data.loadingMoreNotifications && data.notificationHasNext ? (
              <p className="px-2 py-3 text-center text-xs text-slate-500">Kéo xuống để tải thêm</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

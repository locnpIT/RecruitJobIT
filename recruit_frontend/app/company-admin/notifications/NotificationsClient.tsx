"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { notificationService, type NotificationItem } from "@/services/common/notification.service";
import { Button } from "@/components/ui/Button";

export function NotificationsClient() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);

  const loadPage = useCallback(async (trang: number, replace = false) => {
    setLoading(true);
    try {
      const res = await notificationService.list(trang, 20);
      setNotifications((prev) => (replace ? res.danhSach : [...prev, ...res.danhSach]));
      setHasMore(res.conTrangSau);
      setPage(trang);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage(0, true);
  }, [loadPage]);

  const handleMarkRead = async (item: NotificationItem) => {
    if (!item.daDoc) {
      await notificationService.markRead(item.id);
      setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, daDoc: true } : n)));
    }
    if (item.duongDan) {
      router.push(item.duongDan);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, daDoc: true })));
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationService.delete(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.daDoc).length;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Thông báo</h1>
          {unreadCount > 0 ? (
            <p className="mt-0.5 text-sm text-slate-500">{unreadCount} chưa đọc</p>
          ) : null}
        </div>
        {unreadCount > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            <CheckCheck className="mr-1.5 h-4 w-4" />
            Đánh dấu tất cả đã đọc
          </Button>
        ) : null}
      </div>

      {!loading && notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-slate-200 bg-white py-16 text-slate-400">
          <Bell className="h-10 w-10" />
          <p className="text-sm">Chưa có thông báo nào</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
          {notifications.map((item) => (
            <li
              key={item.id}
              onClick={() => handleMarkRead(item)}
              className={`group flex cursor-pointer items-start gap-3 px-4 py-4 transition hover:bg-slate-50 ${!item.daDoc ? "bg-teal-50/60" : ""}`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {!item.daDoc ? (
                  <span className="block h-2 w-2 rounded-full bg-rose-500" />
                ) : (
                  <span className="block h-2 w-2 rounded-full bg-transparent" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${!item.daDoc ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>
                  {item.tieuDe}
                </p>
                <p className="mt-0.5 text-sm text-slate-500">{item.noiDung}</p>
                {item.ngayTao ? (
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(item.ngayTao).toLocaleString("vi-VN")}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={(e) => handleDelete(item.id, e)}
                className="ml-2 flex-shrink-0 rounded p-1 text-slate-300 opacity-0 transition hover:bg-slate-100 hover:text-rose-500 group-hover:opacity-100"
                aria-label="Xoá thông báo"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {loading ? (
        <p className="text-center text-sm text-slate-400">Đang tải...</p>
      ) : null}

      {hasMore && !loading ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => loadPage(page + 1)}
          >
            Xem thêm
          </Button>
        </div>
      ) : null}
    </div>
  );
}

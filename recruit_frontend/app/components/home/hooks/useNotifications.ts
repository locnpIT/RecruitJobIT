"use client";

import { useEffect, useState } from "react";
import { notificationService, type NotificationItem } from "@/services/common/notification.service";
import type { LocalUser } from "./types";

const PAGE_SIZE = 10;

// Tải, phân trang và quản lý trạng thái thông báo cho user đang đăng nhập.
export function useNotifications(user: LocalUser | null) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotifications, setLatestNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [loadingMoreNotifications, setLoadingMoreNotifications] = useState(false);
  const [notificationPage, setNotificationPage] = useState(0);
  const [notificationHasNext, setNotificationHasNext] = useState(false);

  useEffect(() => {
    let active = true;
    let timer: number | null = null;

    Promise.resolve().then(() => {
      if (!active) return;

      if (!user) {
        setUnreadCount(0);
        setLatestNotifications([]);
        return;
      }

      const load = async () => {
        try {
          setLoadingNotifications(true);
          const [countData, listData] = await Promise.all([
            notificationService.unreadCount(),
            notificationService.list(0, PAGE_SIZE),
          ]);
          if (!active) return;
          setUnreadCount(countData.soChuaDoc ?? 0);
          setLatestNotifications(listData.danhSach ?? []);
          setNotificationPage(listData.trang ?? 0);
          setNotificationHasNext(Boolean(listData.conTrangSau));
        } catch {
          if (!active) return;
          setUnreadCount(0);
          setLatestNotifications([]);
          setNotificationPage(0);
          setNotificationHasNext(false);
        } finally {
          if (active) setLoadingNotifications(false);
        }
      };

      void load();
      timer = window.setInterval(() => void load(), 60000);
    });

    return () => {
      active = false;
      if (timer !== null) window.clearInterval(timer);
    };
  }, [user]);

  const loadMoreNotifications = async () => {
    if (loadingMoreNotifications || loadingNotifications || !notificationHasNext) return;
    try {
      setLoadingMoreNotifications(true);
      const nextPage = notificationPage + 1;
      const listData = await notificationService.list(nextPage, PAGE_SIZE);
      setLatestNotifications((current) => {
        const existingIds = new Set(current.map((item) => item.id));
        return [...current, ...(listData.danhSach ?? []).filter((item) => !existingIds.has(item.id))];
      });
      setNotificationPage(listData.trang ?? nextPage);
      setNotificationHasNext(Boolean(listData.conTrangSau));
    } catch {
      // ignore
    } finally {
      setLoadingMoreNotifications(false);
    }
  };

  const markReadAndSync = async (item: NotificationItem) => {
    if (item.daDoc) return;
    await notificationService.markRead(item.id);
    setUnreadCount((current) => (current > 0 ? current - 1 : 0));
    setLatestNotifications((current) =>
      current.map((entry) => (entry.id === item.id ? { ...entry, daDoc: true } : entry)),
    );
  };

  const deleteNotification = async (item: NotificationItem) => {
    await notificationService.delete(item.id);
    setLatestNotifications((current) => current.filter((entry) => entry.id !== item.id));
    if (!item.daDoc) setUnreadCount((current) => (current > 0 ? current - 1 : 0));
  };

  const markAllRead = async () => {
    const result = await notificationService.markAllRead();
    if ((result.soDaCapNhat ?? 0) > 0) {
      setUnreadCount(0);
      setLatestNotifications((current) => current.map((item) => ({ ...item, daDoc: true })));
    }
  };

  return {
    unreadCount,
    latestNotifications,
    loadingNotifications,
    loadingMoreNotifications,
    notificationHasNext,
    loadMoreNotifications,
    markReadAndSync,
    deleteNotification,
    markAllRead,
  };
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { clearAdminSession, getJwtExpiryMs } from "@/lib/admin-session";
import { notificationService, type NotificationItem } from "@/services/common/notification.service";

type LocalUser = {
  id: number;
  email: string;
  ten: string | null;
  ho: string | null;
  vaiTro: string;
  anhDaiDienUrl?: string | null;
};

const NOTIFICATION_PAGE_SIZE = 10;

// Dùng cho HomeHeader: đọc session local + quản lý toàn bộ luồng thông báo (list/read/delete/paging).
export function useHomeHeaderData() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotifications, setLatestNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [loadingMoreNotifications, setLoadingMoreNotifications] = useState(false);
  const [notificationPage, setNotificationPage] = useState(0);
  const [notificationHasNext, setNotificationHasNext] = useState(false);

  useEffect(() => {
    let isMounted = true;

    Promise.resolve().then(() => {
      if (!isMounted) {
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const expiresAt = token ? getJwtExpiryMs(token) : null;
        if (!token || (expiresAt !== null && expiresAt <= Date.now())) {
          clearAdminSession();
          setUser(null);
          return;
        }

        const raw = localStorage.getItem("user");
        setUser(raw ? (JSON.parse(raw) as LocalUser) : null);
      } catch {
        clearAdminSession();
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    let timer: number | null = null;

    Promise.resolve().then(() => {
      if (!active) {
        return;
      }

      if (!user) {
        setUnreadCount(0);
        setLatestNotifications([]);
        return;
      }

      const loadNotifications = async () => {
        try {
          setLoadingNotifications(true);
          const [countData, listData] = await Promise.all([
            notificationService.unreadCount(),
            notificationService.list(0, NOTIFICATION_PAGE_SIZE),
          ]);
          if (!active) {
            return;
          }
          setUnreadCount(countData.soChuaDoc ?? 0);
          setLatestNotifications(listData.danhSach ?? []);
          setNotificationPage(listData.trang ?? 0);
          setNotificationHasNext(Boolean(listData.conTrangSau));
        } catch {
          if (!active) {
            return;
          }
          setUnreadCount(0);
          setLatestNotifications([]);
          setNotificationPage(0);
          setNotificationHasNext(false);
        } finally {
          if (active) {
            setLoadingNotifications(false);
          }
        }
      };

      void loadNotifications();
      timer = window.setInterval(() => {
        void loadNotifications();
      }, 60000);
    });

    return () => {
      active = false;
      if (timer !== null) {
        window.clearInterval(timer);
      }
    };
  }, [user]);

  const role = user?.vaiTro?.toUpperCase() ?? null;
  const isCandidate = role === "CANDIDATE";
  const fullName = useMemo(() => {
    if (!user) {
      return "";
    }
    return `${user.ho ?? ""} ${user.ten ?? ""}`.trim() || user.email;
  }, [user]);
  const userInitial = useMemo(() => {
    const fallback = (user?.email ?? "U").trim();
    const source = (user?.ten ?? user?.ho ?? fallback).trim();
    return source.charAt(0).toUpperCase();
  }, [user]);

  const loadMoreNotifications = async () => {
    if (loadingMoreNotifications || loadingNotifications || !notificationHasNext) {
      return;
    }

    try {
      setLoadingMoreNotifications(true);
      const nextPage = notificationPage + 1;
      const listData = await notificationService.list(nextPage, NOTIFICATION_PAGE_SIZE);
      setLatestNotifications((current) => {
        const existingIds = new Set(current.map((item) => item.id));
        const nextItems = (listData.danhSach ?? []).filter((item) => !existingIds.has(item.id));
        return [...current, ...nextItems];
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
    if (item.daDoc) {
      return;
    }

    await notificationService.markRead(item.id);
    setUnreadCount((current) => (current > 0 ? current - 1 : 0));
    setLatestNotifications((current) =>
      current.map((entry) => (entry.id === item.id ? { ...entry, daDoc: true } : entry)),
    );
  };

  const deleteNotification = async (item: NotificationItem) => {
    await notificationService.delete(item.id);
    setLatestNotifications((current) => current.filter((entry) => entry.id !== item.id));
    if (!item.daDoc) {
      setUnreadCount((current) => (current > 0 ? current - 1 : 0));
    }
  };

  const markAllRead = async () => {
    const result = await notificationService.markAllRead();
    if ((result.soDaCapNhat ?? 0) > 0) {
      setUnreadCount(0);
      setLatestNotifications((current) => current.map((item) => ({ ...item, daDoc: true })));
    }
  };

  return {
    user,
    role,
    isCandidate,
    fullName,
    userInitial,
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

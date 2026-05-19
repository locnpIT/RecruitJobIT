"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "@/lib/api-error";
import { adminUsersService } from "@/services/admin/users.service";
import { adminStatsService } from "@/services/admin/stats.service";
import type { AdminStatsResponse, AdminUser } from "@/services/admin/types";

const PAGE_SIZE = 10;

// Dùng cho màn admin/users: quản lý filter + nạp stats + nạp danh sách user + phân trang client-side.
export function useAdminUsersData() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [keyword, setKeyword] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      keyword: keyword.trim() || undefined,
      role: role || undefined,
      status: status || undefined,
    }),
    [keyword, role, status],
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsResponse, usersResponse] = await Promise.all([
        adminStatsService.getStats(),
        adminUsersService.listUsers(filters),
      ]);
      setStats(statsResponse);
      setUsers(usersResponse);
      setPage(1);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Không tải được dữ liệu người dùng."));
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const statsCards = useMemo(
    () => [
      { label: "Tổng người dùng", value: stats?.tongNguoiDung ?? 0 },
      { label: "Đang hoạt động", value: stats?.nguoiDungHoatDong ?? 0 },
      { label: "Không hoạt động", value: stats?.nguoiDungKhongHoatDong ?? 0 },
    ],
    [stats],
  );

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const pagedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return users.slice(start, start + PAGE_SIZE);
  }, [users, page]);

  return {
    keyword,
    role,
    status,
    page,
    isLoading,
    error,
    users,
    pagedUsers,
    totalPages,
    pageSize: PAGE_SIZE,
    statsCards,
    setKeyword,
    setRole,
    setStatus,
    setPage,
    loadData,
  };
}

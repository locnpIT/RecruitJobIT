"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "../components/PageHeader";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { StatCard } from "../components/StatCard";
import { adminService, type AdminStatsResponse, type AdminUser } from "@/services/admin.service";
import { UsersFilters } from "./components/UsersFilters";
import { UsersTable } from "./components/UsersTable";

// Màn quản lý người dùng hệ thống.
// Đây là container điều phối số liệu tổng, filter, phân trang phía client và thao tác khóa/xóa user.
const roleOptions = ["", "ADMIN", "CANDIDATE"];
const statusOptions = ["", "ACTIVE", "INACTIVE", "DELETED"];
const PAGE_SIZE = 10;

export default function UsersAdminPage() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [keyword, setKeyword] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [confirmUser, setConfirmUser] = useState<AdminUser | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsResponse, usersResponse] = await Promise.all([
        adminService.getStats(),
        adminService.listUsers({
          keyword: keyword.trim() || undefined,
          role: role || undefined,
          status: status || undefined,
        }),
      ]);

      setStats(statsResponse);
      setUsers(usersResponse);
      setPage(1);
    } catch {
      toast.error("Không tải được dữ liệu người dùng.");
    } finally {
      setIsLoading(false);
    }
  }, [keyword, role, status]);

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
    [stats]
  );

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const pagedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return users.slice(start, start + PAGE_SIZE);
  }, [users, page]);

  const handleToggle = async () => {
    if (!confirmUser) {
      return;
    }

    const nextStatus = !confirmUser.dangHoatDong;
    setIsMutating(true);
    try {
      await adminService.updateUserStatus(confirmUser.id, { dangHoatDong: nextStatus });
      toast.success("Đã cập nhật trạng thái người dùng.");
      setConfirmUser(null);
      await loadData();
    } catch {
      toast.error("Không thể cập nhật trạng thái người dùng.");
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    const confirmed = window.confirm(`Xoá người dùng ${user.hoTen || user.email}?`);
    if (!confirmed) {
      return;
    }
    setIsMutating(true);
    try {
      await adminService.deleteUser(user.id);
      toast.success("Đã xoá người dùng.");
      await loadData();
    } catch {
      toast.error("Không thể xoá người dùng.");
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Người dùng"
        title="Quản Lý Người Dùng"
        subtitle="Theo dõi tài khoản, phân quyền và trạng thái hoạt động của toàn bộ người dùng."
      />

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {statsCards.map((item) => (
          <StatCard key={item.label} label={item.label} value={String(item.value)} />
        ))}
      </section>

      <section className="mt-4 rounded-md border border-slate-200 bg-white p-4">
        <UsersFilters
          keyword={keyword}
          role={role}
          status={status}
          roleOptions={roleOptions}
          statusOptions={statusOptions}
          onKeywordChange={setKeyword}
          onRoleChange={setRole}
          onStatusChange={setStatus}
          onApply={() => void loadData()}
        />

        <UsersTable
          users={users}
          pagedUsers={pagedUsers}
          page={page}
          totalPages={totalPages}
          pageSize={PAGE_SIZE}
          isLoading={isLoading}
          isMutating={isMutating}
          onToggle={setConfirmUser}
          onDelete={(user) => void handleDeleteUser(user)}
          onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
          onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        />
      </section>

      <ConfirmDialog
        open={Boolean(confirmUser)}
        title={confirmUser?.dangHoatDong ? "Khóa tài khoản" : "Kích hoạt tài khoản"}
        description={`Bạn có chắc muốn ${confirmUser?.dangHoatDong ? "khóa" : "kích hoạt"} tài khoản ${
          confirmUser?.hoTen || confirmUser?.email || "này"
        }?`}
        confirmLabel={confirmUser?.dangHoatDong ? "Khóa tài khoản" : "Kích hoạt tài khoản"}
        tone={confirmUser?.dangHoatDong ? "danger" : "primary"}
        isLoading={isMutating}
        onCancel={() => setConfirmUser(null)}
        onConfirm={() => void handleToggle()}
      />
    </>
  );
}

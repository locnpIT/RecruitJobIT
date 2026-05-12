"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "../components/PageHeader";
import { StatusPill } from "../components/StatusPill";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { adminService, type AdminStatsResponse, type AdminUser } from "@/services/admin.service";

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
          <article key={item.label} className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="mt-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-4 grid gap-2 md:grid-cols-[1fr_170px_170px_auto]">
          <input
            type="text"
            placeholder="Tìm theo tên, email, số điện thoại..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none ring-slate-200 focus:ring"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
          >
            {roleOptions.map((option) => (
              <option key={option || "all-role"} value={option}>
                {option ? option : "Tất cả vai trò"}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
          >
            {statusOptions.map((option) => (
              <option key={option || "all-status"} value={option}>
                {option ? option : "Tất cả trạng thái"}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void loadData()}
            className="h-10 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Áp dụng
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="h-10 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState title="Không có người dùng phù hợp" description="Thử thay đổi bộ lọc để mở rộng kết quả." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1060px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="pb-2 font-medium">Tên</th>
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Vai trò</th>
                    <th className="pb-2 font-medium">Trạng thái</th>
                    <th className="pb-2 font-medium">Ngày tạo</th>
                    <th className="pb-2 font-medium">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 last:border-none">
                      <td className="py-2.5 font-medium text-slate-900">{user.hoTen || "--"}</td>
                      <td className="py-2.5 text-slate-700">{user.email}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            {user.vaiTroHeThong || "--"}
                          </span>
                          {user.vaiTroCongTy ? (
                            <span className="rounded bg-sky-50 px-2 py-0.5 text-xs text-sky-700">{user.vaiTroCongTy}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-2.5">
                        <StatusPill value={user.trangThai} />
                      </td>
                      <td className="py-2.5 text-slate-600">{new Date(user.ngayTao).toLocaleDateString("vi-VN")}</td>
                      <td className="py-2.5">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={isMutating}
                            onClick={() => setConfirmUser(user)}
                            className={`rounded-md border px-2.5 py-1 font-medium ${
                              user.dangHoatDong
                                ? "border-rose-300 text-rose-700 hover:bg-rose-50"
                                : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                          >
                            {user.dangHoatDong ? "Khóa" : "Kích hoạt"}
                          </button>
                          <button
                            type="button"
                            disabled={isMutating}
                            onClick={() => void handleDeleteUser(user)}
                            className="rounded-md border border-rose-300 px-2.5 py-1 font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Xoá
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Hiển thị {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, users.length)} / {users.length} người dùng
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
                >
                  Trước
                </button>
                <span className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700">
                  {page}/{totalPages}
                </span>
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
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

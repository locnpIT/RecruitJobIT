import { EmptyState } from "../../components/EmptyState";
import { StatusPill } from "../../components/StatusPill";
import type { AdminUser } from "@/services/admin.service";

type UsersTableProps = {
  users: AdminUser[];
  pagedUsers: AdminUser[];
  page: number;
  totalPages: number;
  pageSize: number;
  isLoading: boolean;
  isMutating: boolean;
  onToggle: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
  onPrev: () => void;
  onNext: () => void;
};

// Bảng user + phân trang client-side.
export function UsersTable({
  users,
  pagedUsers,
  page,
  totalPages,
  pageSize,
  isLoading,
  isMutating,
  onToggle,
  onDelete,
  onPrev,
  onNext,
}: UsersTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="h-10 animate-pulse rounded bg-slate-100" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return <EmptyState title="Không có người dùng phù hợp" description="Thử thay đổi bộ lọc để mở rộng kết quả." />;
  }

  return (
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
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{user.vaiTroHeThong || "--"}</span>
                    {user.vaiTroCongTy ? <span className="rounded bg-sky-50 px-2 py-0.5 text-xs text-sky-700">{user.vaiTroCongTy}</span> : null}
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
                      onClick={() => onToggle(user)}
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
                      onClick={() => onDelete(user)}
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
          Hiển thị {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, users.length)} / {users.length} người dùng
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page === 1}
            onClick={onPrev}
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
            onClick={onNext}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      </div>
    </>
  );
}

"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { UsersFilters } from "./UsersFilters";
import { UsersTable } from "./UsersTable";
import { useAdminUsersActions } from "../hooks/useAdminUsersActions";
import { useAdminUsersData } from "../hooks/useAdminUsersData";

const roleOptions = ["", "ADMIN", "CANDIDATE"];
const statusOptions = ["", "ACTIVE", "INACTIVE", "DELETED"];

// Client container cho trang /admin/users.
export function UsersAdminClient() {
  const data = useAdminUsersData();
  const actions = useAdminUsersActions({ onReload: data.loadData });
  const { mutationError, mutationSuccess, setMutationError, setMutationSuccess } = actions;

  useEffect(() => {
    if (data.error) {
      toast.error(data.error);
    }
  }, [data.error]);

  useEffect(() => {
    if (mutationError) {
      toast.error(mutationError);
      setMutationError(null);
    }
  }, [mutationError, setMutationError]);

  useEffect(() => {
    if (mutationSuccess) {
      toast.success(mutationSuccess);
      setMutationSuccess(null);
    }
  }, [mutationSuccess, setMutationSuccess]);

  return (
    <>
      <PageHeader
        eyebrow="Người dùng"
        title="Quản Lý Người Dùng"
        subtitle="Theo dõi tài khoản, phân quyền và trạng thái hoạt động của toàn bộ người dùng."
      />

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {data.statsCards.map((item) => (
          <StatCard key={item.label} label={item.label} value={String(item.value)} />
        ))}
      </section>

      <section className="mt-4 rounded-md border border-slate-200 bg-white p-4">
        <UsersFilters
          keyword={data.keyword}
          role={data.role}
          status={data.status}
          roleOptions={roleOptions}
          statusOptions={statusOptions}
          onKeywordChange={data.setKeyword}
          onRoleChange={data.setRole}
          onStatusChange={data.setStatus}
          onApply={() => void data.loadData()}
        />

        <UsersTable
          users={data.users}
          pagedUsers={data.pagedUsers}
          page={data.page}
          totalPages={data.totalPages}
          pageSize={data.pageSize}
          isLoading={data.isLoading}
          isMutating={actions.isMutating}
          onToggle={actions.setConfirmUser}
          onDelete={(user) => {
            const confirmed = window.confirm(`Xoá người dùng ${user.hoTen || user.email}?`);
            if (!confirmed) {
              return;
            }
            void actions.handleDelete(user);
          }}
          onPrev={() => data.setPage((prev) => Math.max(1, prev - 1))}
          onNext={() => data.setPage((prev) => Math.min(data.totalPages, prev + 1))}
        />
      </section>

      <ConfirmDialog
        open={Boolean(actions.confirmUser)}
        title={actions.confirmUser?.dangHoatDong ? "Khóa tài khoản" : "Kích hoạt tài khoản"}
        description={`Bạn có chắc muốn ${actions.confirmUser?.dangHoatDong ? "khóa" : "kích hoạt"} tài khoản ${
          actions.confirmUser?.hoTen || actions.confirmUser?.email || "này"
        }?`}
        confirmLabel={actions.confirmUser?.dangHoatDong ? "Khóa tài khoản" : "Kích hoạt tài khoản"}
        tone={actions.confirmUser?.dangHoatDong ? "danger" : "primary"}
        isLoading={actions.isMutating}
        onCancel={() => actions.setConfirmUser(null)}
        onConfirm={() => void actions.handleToggle()}
      />
    </>
  );
}

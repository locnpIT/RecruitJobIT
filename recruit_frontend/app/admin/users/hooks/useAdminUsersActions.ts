"use client";

import { useState } from "react";
import { getApiErrorMessage } from "@/lib/api-error";
import { adminUsersService } from "@/services/admin/users.service";
import type { AdminUser } from "@/services/admin/types";

type UseAdminUsersActionsOptions = {
  onReload: () => Promise<void>;
};

// Dùng cho màn admin/users: thao tác khóa/kích hoạt và xoá user.
export function useAdminUsersActions({ onReload }: UseAdminUsersActionsOptions) {
  const [isMutating, setIsMutating] = useState(false);
  const [confirmUser, setConfirmUser] = useState<AdminUser | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationSuccess, setMutationSuccess] = useState<string | null>(null);

  const handleToggle = async () => {
    if (!confirmUser) {
      return;
    }

    const nextStatus = !confirmUser.dangHoatDong;
    setIsMutating(true);
    setMutationError(null);
    setMutationSuccess(null);
    try {
      await adminUsersService.updateUserStatus(confirmUser.id, { dangHoatDong: nextStatus });
      setMutationSuccess("Đã cập nhật trạng thái người dùng.");
      setConfirmUser(null);
      await onReload();
    } catch (error) {
      setMutationError(getApiErrorMessage(error, "Không thể cập nhật trạng thái người dùng."));
    } finally {
      setIsMutating(false);
    }
  };

  const handleDelete = async (user: AdminUser) => {
    setIsMutating(true);
    setMutationError(null);
    setMutationSuccess(null);
    try {
      await adminUsersService.deleteUser(user.id);
      setMutationSuccess("Đã xoá người dùng.");
      await onReload();
    } catch (error) {
      setMutationError(getApiErrorMessage(error, "Không thể xoá người dùng."));
    } finally {
      setIsMutating(false);
    }
  };

  return {
    isMutating,
    confirmUser,
    mutationError,
    mutationSuccess,
    setConfirmUser,
    setMutationError,
    setMutationSuccess,
    handleToggle,
    handleDelete,
  };
}

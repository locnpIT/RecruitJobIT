"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { clearAdminSession } from "@/lib/admin-session";
import type { useHomeHeaderData } from "./hooks/useHomeHeaderData";

type UserMenuData = Pick<
  ReturnType<typeof useHomeHeaderData>,
  "user" | "userInitial" | "fullName" | "isCandidate" | "role"
>;

type UserMenuDropdownProps = {
  open: boolean;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  data: UserMenuData;
  onToggle: () => void;
  onClose: () => void;
};

export function UserMenuDropdown({ open, dropdownRef, data, onToggle, onClose }: UserMenuDropdownProps) {
  if (!data.user) {
    return null;
  }

  return (
    <div ref={dropdownRef} className="relative">
      <Button
        type="button"
        variant="unstyled"
        onClick={onToggle}
        className={`inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full p-0 text-sm font-semibold ${
          data.user.anhDaiDienUrl ? "bg-slate-100" : "bg-slate-900 text-white"
        }`}
        aria-label="Mở menu tài khoản"
      >
        {data.user.anhDaiDienUrl ? (
          <span className="relative block h-10 w-10 overflow-hidden rounded-full">
            <Image
              src={data.user.anhDaiDienUrl}
              alt="Avatar người dùng"
              fill
              sizes="40px"
              className="object-cover object-center"
            />
          </span>
        ) : (
          data.userInitial
        )}
      </Button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-56 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
          <div className="mb-2 rounded-md bg-slate-50 px-3 py-2">
            <p className="text-sm font-semibold text-slate-900">{data.fullName}</p>
            <p className="text-xs text-slate-600">{data.user.email}</p>
          </div>

          {data.isCandidate ? (
            <Link
              href="/profile"
              onClick={onClose}
              className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Hồ sơ
            </Link>
          ) : (
            <Link
              href={data.role === "ADMIN" ? "/admin" : "/company-admin"}
              onClick={onClose}
              className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Vào hệ thống
            </Link>
          )}

          {data.isCandidate ? (
            <Link
              href="/messages"
              onClick={onClose}
              className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Tin nhắn
            </Link>
          ) : null}

          {data.isCandidate ? (
            <Link
              href="/favorite-jobs"
              onClick={onClose}
              className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Việc làm yêu thích
            </Link>
          ) : null}

          <Button
            type="button"
            variant="unstyled"
            onClick={() => {
              clearAdminSession();
              window.location.assign("/");
            }}
            className="mt-1 block w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
          >
            Đăng xuất
          </Button>
        </div>
      ) : null}
    </div>
  );
}

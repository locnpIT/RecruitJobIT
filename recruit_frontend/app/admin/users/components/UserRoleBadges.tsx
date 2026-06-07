import type { AdminUser } from "@/services/admin/types";

function shouldShowSystemRole(user: AdminUser) {
  return !user.vaiTroCongTy || user.vaiTroHeThong?.toUpperCase() !== "CANDIDATE";
}

export function UserRoleBadges({ user }: { user: AdminUser }) {
  const showSystemRole = shouldShowSystemRole(user);

  return (
    <div className="flex items-center gap-2">
      {showSystemRole ? (
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
          {user.vaiTroHeThong || "--"}
        </span>
      ) : null}
      {user.vaiTroCongTy ? (
        <span className="rounded bg-sky-50 px-2 py-0.5 text-xs text-sky-700">{user.vaiTroCongTy}</span>
      ) : null}
    </div>
  );
}

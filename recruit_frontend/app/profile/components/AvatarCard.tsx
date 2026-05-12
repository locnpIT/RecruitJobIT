import Image from "next/image";
import { type ChangeEvent, type RefObject } from "react";
import { ProfileActionButton } from "./ProfileActionButton";

export function AvatarCard({
  avatarUrl,
  fullName,
  email,
  uploading,
  fileInputRef,
  onSelectAvatar,
}: {
  avatarUrl: string | null;
  fullName: string;
  email: string;
  uploading: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onSelectAvatar: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-md border border-slate-200 bg-white p-3">
      <div className="relative h-20 w-20 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
        {avatarUrl ? (
          <Image src={avatarUrl} alt="Avatar ứng viên" fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-600">
            {fullName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900">{fullName}</p>
        <p className="text-xs text-slate-600">{email}</p>
        <div className="mt-2">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={onSelectAvatar} className="hidden" />
          <ProfileActionButton
            type="button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-3 py-1.5 text-xs"
          >
            {uploading ? "Đang tải ảnh..." : "Đổi ảnh đại diện"}
          </ProfileActionButton>
        </div>
      </div>
    </div>
  );
}

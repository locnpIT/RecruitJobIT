import type { CandidateProfileListItem } from "@/services/candidate/candidate-profile.service";
import { ProfileActionButton } from "./ProfileActionButton";

// Hero/header của màn profile.
// Chứa selector chuyển hồ sơ đang thao tác và CTA tạo hồ sơ mới.
export function ProfileHero({
  profiles,
  activeProfileId,
  creatingProfile,
  settingPrimary = false,
  onChangeProfile,
  onCreateProfile,
  onSetPrimary,
}: {
  profiles: CandidateProfileListItem[];
  activeProfileId: number | null;
  creatingProfile: boolean;
  settingPrimary?: boolean;
  onChangeProfile: (profileId: number | null) => void;
  onCreateProfile: () => void;
  onSetPrimary?: (profileId: number) => void;
}) {
  const hasProfiles = profiles.length > 0;
  const activeProfile = profiles.find((p) => p.id === activeProfileId);
  const isActivePrimary = activeProfile?.laHoSoChinh ?? false;

  return (
    <section className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
      <p className="text-sm font-medium text-slate-600">← Về trang chủ</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Hồ sơ ứng viên</h1>
      <p className="mt-2 text-slate-600">Quản lý thông tin hồ sơ và các chứng chỉ, học vấn của bạn.</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select
          value={activeProfileId ?? ""}
          onChange={(e) => onChangeProfile(e.target.value ? Number(e.target.value) : null)}
          disabled={!hasProfiles}
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
        >
          {!hasProfiles && <option value="">Chưa có hồ sơ</option>}
          {profiles.map((item) => (
            <option key={item.id} value={item.id}>
              {item.tieuDe}{item.laHoSoChinh ? " (Chính)" : ""}
            </option>
          ))}
        </select>
        <ProfileActionButton type="button" disabled={creatingProfile} onClick={onCreateProfile}>
          {hasProfiles ? "Tạo hồ sơ mới" : "Tạo hồ sơ đầu tiên"}
        </ProfileActionButton>
      </div>
      {hasProfiles && activeProfileId != null ? (
        <div className="mt-3 flex items-center gap-2">
          {isActivePrimary ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 ring-1 ring-inset ring-teal-200">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              Hồ sơ chính — dùng cho gợi ý việc làm trên trang chủ
            </span>
          ) : (
            <ProfileActionButton
              type="button"
              variant="muted"
              disabled={settingPrimary}
              onClick={() => onSetPrimary?.(activeProfileId)}
            >
              {settingPrimary ? "Đang đặt..." : "Đặt làm hồ sơ chính"}
            </ProfileActionButton>
          )}
        </div>
      ) : null}
    </section>
  );
}

import { FileUser } from "lucide-react";
import { ProfileActionButton } from "./ProfileActionButton";

type ProfileEmptyStateProps = {
  creating: boolean;
  onCreateProfile: () => void;
};

// Empty state khi candidate mới đăng ký nhưng chưa chủ động tạo hồ sơ ứng viên.
export function ProfileEmptyState({ creating, onCreateProfile }: ProfileEmptyStateProps) {
  return (
    <section className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-teal-50 text-[#008080]">
        <FileUser className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-slate-950">Bạn chưa có hồ sơ ứng viên</h2>
      <ProfileActionButton
        type="button"
        className="mt-5"
        disabled={creating}
        onClick={onCreateProfile}
      >
        {creating ? "Đang tạo..." : "Tạo hồ sơ đầu tiên"}
      </ProfileActionButton>
    </section>
  );
}

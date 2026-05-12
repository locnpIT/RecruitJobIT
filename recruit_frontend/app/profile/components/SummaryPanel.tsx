import { ProfileActionButton } from "./ProfileActionButton";

// Panel cập nhật summary của hồ sơ ứng viên:
// giới thiệu bản thân và mục tiêu nghề nghiệp.
export function SummaryPanel({
  gioiThieuBanThan,
  mucTieuNgheNghiep,
  saving,
  onChange,
  onSave,
}: {
  gioiThieuBanThan: string;
  mucTieuNgheNghiep: string;
  saving: boolean;
  onChange: (next: { gioiThieuBanThan: string; mucTieuNgheNghiep: string }) => void;
  onSave: () => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-slate-900">Giới thiệu hồ sơ</h2>
      <p className="mt-1 text-sm text-slate-600">Cập nhật giới thiệu bản thân và mục tiêu nghề nghiệp để tăng tỷ lệ phù hợp.</p>
      <div className="mt-4 grid gap-3">
        <textarea
          rows={4}
          value={gioiThieuBanThan}
          onChange={(e) => onChange({ gioiThieuBanThan: e.target.value, mucTieuNgheNghiep })}
          placeholder="Giới thiệu ngắn gọn về kinh nghiệm, thế mạnh của bạn"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <textarea
          rows={4}
          value={mucTieuNgheNghiep}
          onChange={(e) => onChange({ gioiThieuBanThan, mucTieuNgheNghiep: e.target.value })}
          placeholder="Mục tiêu nghề nghiệp trong 1-2 năm tới"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <ProfileActionButton type="button" onClick={onSave} disabled={saving} className="mt-4">
        {saving ? "Đang lưu..." : "Lưu giới thiệu"}
      </ProfileActionButton>
    </section>
  );
}

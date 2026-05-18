import type { Province, Ward } from "@/services/location.service";

export type PersonalInfoFormState = {
  soDienThoai: string;
  ngaySinh: string;
  gioiTinh: string;
  diaChiChiTiet: string;
  tinhThanhId: string;
  xaPhuongId: string;
};

export function PersonalInfoPanel({
  form,
  provinces,
  wards,
  loadingWards,
  saving,
  onChange,
  onSave,
}: {
  form: PersonalInfoFormState;
  provinces: Province[];
  wards: Ward[];
  loadingWards: boolean;
  saving: boolean;
  onChange: (next: PersonalInfoFormState) => void;
  onSave: () => void;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Thông tin cá nhân</h3>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Đang lưu..." : "Lưu thông tin"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Số điện thoại</span>
          <input
            value={form.soDienThoai}
            onChange={(event) => onChange({ ...form, soDienThoai: event.target.value })}
            placeholder="Nhập số điện thoại"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Ngày sinh</span>
          <input
            type="date"
            value={form.ngaySinh}
            onChange={(event) => onChange({ ...form, ngaySinh: event.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Giới tính</span>
          <select
            value={form.gioiTinh}
            onChange={(event) => onChange({ ...form, gioiTinh: event.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
          >
            <option value="">Chưa chọn</option>
            <option value="NAM">Nam</option>
            <option value="NU">Nữ</option>
            <option value="KHAC">Khác</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Tỉnh/Thành</span>
          <select
            value={form.tinhThanhId}
            onChange={(event) =>
              onChange({
                ...form,
                tinhThanhId: event.target.value,
                // Khi đổi tỉnh thì reset xã/phường để tránh submit sai địa bàn.
                xaPhuongId: "",
              })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
          >
            <option value="">Chưa chọn</option>
            {provinces.map((item) => (
              <option key={item.id} value={item.id}>
                {item.ten}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Xã/Phường</span>
          <select
            value={form.xaPhuongId}
            disabled={!form.tinhThanhId || loadingWards}
            onChange={(event) => onChange({ ...form, xaPhuongId: event.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <option value="">
              {!form.tinhThanhId ? "Chọn tỉnh/thành trước" : loadingWards ? "Đang tải..." : "Chưa chọn"}
            </option>
            {wards.map((item) => (
              <option key={item.id} value={item.id}>
                {item.ten}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 md:col-span-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Địa chỉ chi tiết</span>
          <input
            value={form.diaChiChiTiet}
            onChange={(event) => onChange({ ...form, diaChiChiTiet: event.target.value })}
            placeholder="Số nhà, đường..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
          />
        </label>
      </div>
    </section>
  );
}

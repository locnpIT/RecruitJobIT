import type { CompanyInfoForm } from "./types";

type CompanyInfoSectionProps = {
  form: CompanyInfoForm;
  onChange: (next: CompanyInfoForm) => void;
};

// Form thông tin cơ bản của công ty (tên, MST, website, mô tả).
export function CompanyInfoSection({ form, onChange }: CompanyInfoSectionProps) {
  const setField = <K extends keyof CompanyInfoForm>(key: K, value: CompanyInfoForm[K]) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <div>
      <h2 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        Thông tin công ty
      </h2>
      <div className="mt-4 space-y-4">
        <Field label="Tên công ty" value={form.tenCongTy} onChange={(value) => setField("tenCongTy", value)} placeholder="Tên công ty" />
        <Field label="Mã số thuế" value={form.maSoThue} onChange={(value) => setField("maSoThue", value)} placeholder="Mã số thuế" />
        <Field label="Website" value={form.website} onChange={(value) => setField("website", value)} placeholder="https://..." />
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Mô tả công ty</label>
          <textarea
            value={form.moTaCongTy}
            onChange={(event) => setField("moTaCongTy", event.target.value)}
            rows={5}
            className="w-full border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
            placeholder="Mô tả ngắn về công ty"
          />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
      />
    </label>
  );
}

import { Upload } from "lucide-react";

type CompanyLogoSectionProps = {
  companyLogo: string | null;
  logoPreview: string | null;
  isSaving: boolean;
  onChangeFile: (file: File | null) => void;
  onUpload: () => void;
};

// Khu vực upload logo công ty.
export function CompanyLogoSection({
  companyLogo,
  logoPreview,
  isSaving,
  onChangeFile,
  onUpload,
}: CompanyLogoSectionProps) {
  return (
    <div>
      <h2 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Logo công ty</h2>
      <div className="mt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden border border-slate-200 bg-white">
            {companyLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={companyLogo} alt="Logo công ty" className="h-full w-full object-contain p-1" />
            ) : null}
          </div>
          <div className="text-sm text-slate-600">{companyLogo ? "Đã cập nhật" : "Chưa có logo"}</div>
        </div>

        <div className="mt-6 space-y-3">
          <label className="block text-sm font-medium text-slate-700">Chọn file logo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => onChangeFile(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-600 file:mr-4 file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:transition file:hover:bg-emerald-700"
          />

          {logoPreview ? (
            <div className="border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoPreview} alt="Xem trước logo" className="h-44 w-full object-contain p-3" />
            </div>
          ) : null}

          <button
            type="button"
            onClick={onUpload}
            disabled={isSaving}
            className="inline-flex w-full items-center justify-center gap-2 border border-emerald-600 px-4 py-3 text-sm font-medium text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-700 hover:bg-emerald-600 hover:text-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            <Upload className="h-4 w-4" />
            {isSaving ? "Đang lưu..." : "Cập nhật logo"}
          </button>
        </div>
      </div>
    </div>
  );
}

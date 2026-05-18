import { Building, Upload } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { OwnerFormValues } from "./types";
import { OwnerRegisterNotice } from "./OwnerRegisterNotice";

type OwnerProofUploadSectionProps = {
  register: UseFormRegister<OwnerFormValues>;
  errors: FieldErrors<OwnerFormValues>;
  fileName: string | null;
  onFileNameChange: (name: string | null) => void;
};

// Section upload minh chứng pháp lý công ty.
export function OwnerProofUploadSection({ register, errors, fileName, onFileNameChange }: OwnerProofUploadSectionProps) {
  return (
    <section className="space-y-4">
      <h3 className="flex items-center gap-2 font-semibold text-slate-900">
        <Building size={18} className="text-blue-600" /> Minh chứng doanh nghiệp
      </h3>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-900">Tệp minh chứng (PDF/Ảnh)</label>
        <div className="group relative cursor-pointer rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition-all hover:border-blue-500">
          <input
            type="file"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            {...register("tepMinhChung")}
            onChange={(e) => {
              onFileNameChange(e.target.files?.[0]?.name ?? null);
            }}
          />
          <Upload className="mx-auto mb-2 text-slate-400 group-hover:text-blue-500" size={32} />
          <p className="text-sm text-slate-600">
            {fileName ? <span className="font-bold text-blue-600">{fileName}</span> : "Tải lên Giấy phép kinh doanh hoặc MST"}
          </p>
          <p className="mt-2 text-xs text-slate-400">Hỗ trợ PDF, JPG, PNG (Tối đa 10MB)</p>
        </div>
        {errors.tepMinhChung ? <p className="mt-1 text-xs text-red-500">{errors.tepMinhChung.message as string}</p> : null}
      </div>

      <OwnerRegisterNotice />
    </section>
  );
}

import { BadgeCheck, Building, FileText, Globe } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import type { OwnerFormValues } from "./types";

type OwnerCompanyInfoSectionProps = {
  register: UseFormRegister<OwnerFormValues>;
  errors: FieldErrors<OwnerFormValues>;
};

// Section thông tin pháp lý + mô tả công ty.
export function OwnerCompanyInfoSection({ register, errors }: OwnerCompanyInfoSectionProps) {
  return (
    <section className="space-y-4">
      <h3 className="flex items-center gap-2 font-semibold text-slate-900">
        <Building size={18} className="text-blue-600" /> Thông tin công ty
      </h3>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-900">Tên công ty</label>
        <Input {...register("tenCongTy")} placeholder="Công ty ABC" />
        {errors.tenCongTy ? <p className="mt-1 text-xs text-red-500">{errors.tenCongTy.message}</p> : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-900">Mã số thuế</label>
        <div className="relative">
          <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input {...register("maSoThue")} className="pl-10" placeholder="0312345678" />
        </div>
        {errors.maSoThue ? <p className="mt-1 text-xs text-red-500">{errors.maSoThue.message}</p> : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-900">Website công ty</label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input {...register("website")} className="pl-10" placeholder="https://company.com" />
        </div>
        {errors.website ? <p className="mt-1 text-xs text-red-500">{errors.website.message}</p> : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-900">Mô tả công ty</label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 text-slate-400" size={18} />
          <textarea
            {...register("moTaCongTy")}
            rows={4}
            className="flex w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-950 ring-offset-white placeholder:text-slate-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Giới thiệu ngắn về lĩnh vực, quy mô, giá trị..."
          />
        </div>
        {errors.moTaCongTy ? <p className="mt-1 text-xs text-red-500">{errors.moTaCongTy.message}</p> : null}
      </div>
    </section>
  );
}

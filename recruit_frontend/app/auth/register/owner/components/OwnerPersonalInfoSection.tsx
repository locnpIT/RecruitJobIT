import { Phone, User } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import type { OwnerFormValues } from "./types";

type OwnerPersonalInfoSectionProps = {
  register: UseFormRegister<OwnerFormValues>;
  errors: FieldErrors<OwnerFormValues>;
};

// Section thông tin cá nhân của owner khi đăng ký công ty.
export function OwnerPersonalInfoSection({ register, errors }: OwnerPersonalInfoSectionProps) {
  return (
    <section className="space-y-4">
      <h3 className="flex items-center gap-2 font-semibold text-slate-900">
        <User size={18} className="text-blue-600" /> Thông tin cá nhân
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-900">Họ</label>
          <Input {...register("ho")} placeholder="Nguyễn" />
          {errors.ho ? <p className="mt-1 text-xs text-red-500">{errors.ho.message}</p> : null}
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-900">Tên</label>
          <Input {...register("ten")} placeholder="Văn A" />
          {errors.ten ? <p className="mt-1 text-xs text-red-500">{errors.ten.message}</p> : null}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-900">Số điện thoại</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input {...register("soDienThoai")} className="pl-10" placeholder="0123456789" />
        </div>
        {errors.soDienThoai ? <p className="mt-1 text-xs text-red-500">{errors.soDienThoai.message}</p> : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-900">Email công việc</label>
        <Input {...register("email")} placeholder="hr@company.com" />
        {errors.email ? <p className="mt-1 text-xs text-red-500">{errors.email.message}</p> : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-900">Mật khẩu</label>
        <Input {...register("matKhau")} type="password" placeholder="••••••••" />
        {errors.matKhau ? <p className="mt-1 text-xs text-red-500">{errors.matKhau.message}</p> : null}
      </div>
    </section>
  );
}

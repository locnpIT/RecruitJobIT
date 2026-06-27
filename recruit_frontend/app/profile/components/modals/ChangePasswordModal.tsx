"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProfileModal } from "./ProfileModal";
import { authService } from "@/services/auth/auth.service";

const schema = z
  .object({
    matKhauHienTai: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    matKhauMoi: z.string().min(6, "Mật khẩu mới phải ít nhất 6 ký tự"),
    xacNhanMatKhau: z.string().min(1, "Vui lòng xác nhận mật khẩu mới"),
  })
  .refine((data) => data.matKhauMoi === data.xacNhanMatKhau, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["xacNhanMatKhau"],
  });

type FormValues = z.infer<typeof schema>;

type ChangePasswordModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function handleClose() {
    reset();
    setErrorMsg("");
    setSuccessMsg("");
    onClose();
  }

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await authService.changePassword({
        matKhauHienTai: data.matKhauHienTai,
        matKhauMoi: data.matKhauMoi,
      });
      setSuccessMsg("Đổi mật khẩu thành công!");
      reset();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrorMsg(msg ?? "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ProfileModal open={open} title="Đổi mật khẩu" description="Nhập mật khẩu hiện tại và mật khẩu mới." onClose={handleClose}>
      <form className="space-y-5 px-6 py-5" onSubmit={handleSubmit((d) => void onSubmit(d))}>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-900">Mật khẩu hiện tại</label>
          <div className="relative">
            <Input
              {...register("matKhauHienTai")}
              type={showCurrent ? "text" : "password"}
              placeholder="••••••••"
              className={errors.matKhauHienTai ? "border-red-500" : ""}
            />
            <button
              type="button"
              onClick={() => setShowCurrent((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.matKhauHienTai && <p className="mt-1 text-xs text-red-500">{errors.matKhauHienTai.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-900">Mật khẩu mới</label>
          <div className="relative">
            <Input
              {...register("matKhauMoi")}
              type={showNew ? "text" : "password"}
              placeholder="••••••••"
              className={errors.matKhauMoi ? "border-red-500" : ""}
            />
            <button
              type="button"
              onClick={() => setShowNew((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.matKhauMoi && <p className="mt-1 text-xs text-red-500">{errors.matKhauMoi.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-900">Xác nhận mật khẩu mới</label>
          <div className="relative">
            <Input
              {...register("xacNhanMatKhau")}
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              className={errors.xacNhanMatKhau ? "border-red-500" : ""}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.xacNhanMatKhau && <p className="mt-1 text-xs text-red-500">{errors.xacNhanMatKhau.message}</p>}
        </div>

        {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}
        {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang lưu...</> : "Lưu mật khẩu"}
          </Button>
        </div>
      </form>
    </ProfileModal>
  );
}

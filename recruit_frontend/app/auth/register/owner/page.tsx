"use client";

import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { BadgeCheck, Building, FileText, Globe, Loader2, Minus, Phone, Plus, Upload, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authService } from "@/services/auth.service";
import type { RegisterOwnerPayload } from "@/services/auth.service";
import { locationService, type Province, type Ward } from "@/services/location.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AuthLayout, AuthSectionHeader } from "../../components/AuthLayout";
import { AuthTabs } from "../../components/AuthTabs";

// Trang đăng ký owner/doanh nghiệp.
// Đây là form nhiều bước dữ liệu: thông tin cá nhân, công ty, chi nhánh và minh chứng pháp lý.
const branchSchema = z.object({
  tenChiNhanh: z.string().min(1, "Tên chi nhánh không được để trống"),
  diaChiChiTietChiNhanh: z.string().min(1, "Địa chỉ chi nhánh không được để trống"),
  tinhThanhId: z.string().min(1, "Tỉnh/thành không được để trống"),
  tenXaPhuong: z.string().min(1, "Phường/xã không được để trống"),
});

const ownerRegisterSchema = z.object({
  ho: z.string().min(1, "Họ không được để trống"),
  ten: z.string().min(1, "Tên không được để trống"),
  email: z.string().email("Email không hợp lệ"),
  soDienThoai: z.string().min(10, "Số điện thoại không hợp lệ"),
  matKhau: z.string().min(6, "Mật khẩu phải ít nhất 6 ký tự"),
  tenCongTy: z.string().min(1, "Tên công ty không được để trống"),
  maSoThue: z.string().min(1, "Mã số thuế không được để trống"),
  website: z.string().max(255).optional(),
  moTaCongTy: z.string().max(5000).optional(),
  chiNhanhs: z.array(branchSchema).min(1, "Cần ít nhất một chi nhánh"),
  tepMinhChung: z.any().refine((files) => files?.length > 0, "Vui lòng tải lên file minh chứng"),
});

type OwnerFormValues = z.infer<typeof ownerRegisterSchema>;

const defaultBranch = {
  tenChiNhanh: "",
  diaChiChiTietChiNhanh: "",
  tinhThanhId: "",
  tenXaPhuong: "",
};

export default function OwnerRegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wardOptionsByProvinceId, setWardOptionsByProvinceId] = useState<Record<number, Ward[]>>({});
  const [wardLoadingProvinceIds, setWardLoadingProvinceIds] = useState<number[]>([]);
  const [primaryBranchIndex, setPrimaryBranchIndex] = useState(0);
  const router = useRouter();

  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<OwnerFormValues>({
    resolver: zodResolver(ownerRegisterSchema),
    defaultValues: {
      chiNhanhs: [defaultBranch],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "chiNhanhs",
  });

  const watchedBranches = useWatch({
    control,
    name: "chiNhanhs",
  });

  useEffect(() => {
    let active = true;
    locationService.getProvinces()
      .then((response) => {
        if (active) {
          setProvinces(response);
        }
      })
      .catch(() => {
        if (active) {
          toast.error("Không tải được danh sách tỉnh/thành.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const provinceIdsToLoad = Array.from(
      new Set(
        (watchedBranches ?? [])
          .map((branch) => Number(branch?.tinhThanhId))
          .filter((provinceId) => Number.isInteger(provinceId) && provinceId > 0 && !wardOptionsByProvinceId[provinceId])
      )
    );

    if (provinceIdsToLoad.length === 0) {
      return;
    }

    let active = true;

    const loadWards = async () => {
      setWardLoadingProvinceIds((current) => Array.from(new Set([...current, ...provinceIdsToLoad])));
      try {
        const responses = await Promise.all(
          provinceIdsToLoad.map(async (provinceId) => ({
            provinceId,
            wards: await locationService.getWards(provinceId),
          }))
        );

        if (!active) {
          return;
        }

        setWardOptionsByProvinceId((current) => {
          const next = { ...current };
          responses.forEach(({ provinceId, wards }) => {
            next[provinceId] = wards;
          });
          return next;
        });
      } catch {
        if (active) {
          toast.error("Không tải được danh sách phường/xã.");
        }
      } finally {
        if (active) {
          setWardLoadingProvinceIds((current) => current.filter((provinceId) => !provinceIdsToLoad.includes(provinceId)));
        }
      }
    };

    void loadWards();

    return () => {
      active = false;
    };
  }, [watchedBranches, wardOptionsByProvinceId]);

  const onSubmit = async (data: OwnerFormValues) => {
    setIsLoading(true);
    try {
      const signatureData = await authService.getCloudinarySignature("proof");
      const fileUrl = await authService.uploadToCloudinary(data.tepMinhChung[0], signatureData);

      const payload: RegisterOwnerPayload = {
        ho: data.ho,
        ten: data.ten,
        email: data.email,
        matKhau: data.matKhau,
        soDienThoai: data.soDienThoai,
        tenCongTy: data.tenCongTy,
        maSoThue: data.maSoThue,
        website: data.website || "",
        moTaCongTy: data.moTaCongTy || "",
        chiNhanhs: data.chiNhanhs.map((branch, index) => ({
          tenChiNhanh: branch.tenChiNhanh,
          diaChiChiTietChiNhanh: branch.diaChiChiTietChiNhanh,
          tenXaPhuong: branch.tenXaPhuong,
          tinhThanhId: Number(branch.tinhThanhId),
          laTruSoChinh: index === primaryBranchIndex,
        })),
        duongDanMinhChung: fileUrl,
      };

      await authService.registerOwner(payload);

      toast.success("Đăng ký công ty thành công! Đang chờ duyệt.");
      router.push("/auth/login");
    } catch (error: unknown) {
      const message =
        typeof error === "object" && error !== null && "response" in error
          ? ((error as { response?: { data?: { message?: string } } }).response?.data?.message ??
            "Đăng ký thất bại. Vui lòng thử lại.")
          : "Đăng ký thất bại. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const addBranch = () => {
    append(defaultBranch);
    setPrimaryBranchIndex(fields.length);
  };

  const removeBranch = (index: number) => {
    remove(index);
    if (index === primaryBranchIndex) {
      setPrimaryBranchIndex(0);
    } else if (index < primaryBranchIndex) {
      setPrimaryBranchIndex((current) => Math.max(0, current - 1));
    }
  };

  const provinceOptions = useMemo(
    () => provinces.map((province) => ({ value: String(province.id), label: province.ten })),
    [provinces]
  );

  const getProvinceLabel = (provinceId?: string) => {
    if (!provinceId) {
      return "--";
    }
    return provinceOptions.find((province) => province.value === provinceId)?.label ?? "--";
  };

  return (
    <AuthLayout>
      <div className="mx-auto w-full max-w-5xl space-y-8 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <AuthSectionHeader
          title="Đăng ký công ty tuyển dụng"
          description="Thiết lập hồ sơ doanh nghiệp, khai báo chi nhánh và gửi yêu cầu xét duyệt một lần."
        />

        <div className="mt-5">
          <AuthTabs current="owner" />
        </div>

        <form className="mt-8 space-y-8" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                <User size={18} className="text-blue-600" /> Thông tin cá nhân
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-900">Họ</label>
                  <Input {...register("ho")} placeholder="Nguyễn" />
                  {errors.ho && <p className="mt-1 text-xs text-red-500">{errors.ho.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-900">Tên</label>
                  <Input {...register("ten")} placeholder="Văn A" />
                  {errors.ten && <p className="mt-1 text-xs text-red-500">{errors.ten.message}</p>}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input {...register("soDienThoai")} className="pl-10" placeholder="0123456789" />
                </div>
                {errors.soDienThoai && <p className="mt-1 text-xs text-red-500">{errors.soDienThoai.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">Email công việc</label>
                <Input {...register("email")} placeholder="hr@company.com" />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">Mật khẩu</label>
                <Input {...register("matKhau")} type="password" placeholder="••••••••" />
                {errors.matKhau && <p className="mt-1 text-xs text-red-500">{errors.matKhau.message}</p>}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                <Building size={18} className="text-blue-600" /> Thông tin công ty
              </h3>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">Tên công ty</label>
                <Input {...register("tenCongTy")} placeholder="Công ty ABC" />
                {errors.tenCongTy && <p className="mt-1 text-xs text-red-500">{errors.tenCongTy.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">Mã số thuế</label>
                <div className="relative">
                  <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input {...register("maSoThue")} className="pl-10" placeholder="0312345678" />
                </div>
                {errors.maSoThue && <p className="mt-1 text-xs text-red-500">{errors.maSoThue.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">Website công ty</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input {...register("website")} className="pl-10" placeholder="https://company.com" />
                </div>
                {errors.website && <p className="mt-1 text-xs text-red-500">{errors.website.message}</p>}
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
                {errors.moTaCongTy && <p className="mt-1 text-xs text-red-500">{errors.moTaCongTy.message}</p>}
              </div>
            </section>
          </div>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                  <Building size={18} className="text-blue-600" /> Chi nhánh
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Có thể thêm nhiều chi nhánh. Chọn một chi nhánh làm chi nhánh chính.
                </p>
              </div>

              <Button type="button" variant="outline" size="sm" onClick={addBranch}>
                <Plus className="mr-2 h-4 w-4" />
                Thêm chi nhánh
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <article key={field.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-slate-900">
                        Chi nhánh {index + 1}
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">
                        Chi nhánh đang được chọn làm chính: {primaryBranchIndex === index ? "Có" : "Không"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex cursor-pointer items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        <input
                          type="radio"
                          name="primaryBranch"
                          checked={primaryBranchIndex === index}
                          onChange={() => setPrimaryBranchIndex(index)}
                        />
                        Chi nhánh chính
                      </label>
                      {fields.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeBranch(index)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100"
                        >
                          <Minus size={16} />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-900">Tên chi nhánh</label>
                      <Input {...register(`chiNhanhs.${index}.tenChiNhanh`)} placeholder="Trụ sở chính" />
                      {errors.chiNhanhs?.[index]?.tenChiNhanh && (
                        <p className="mt-1 text-xs text-red-500">{errors.chiNhanhs[index]?.tenChiNhanh?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-900">Địa chỉ chi nhánh</label>
                      <Input {...register(`chiNhanhs.${index}.diaChiChiTietChiNhanh`)} placeholder="123 Nguyễn Huệ, Quận 1, TP.HCM" />
                      {errors.chiNhanhs?.[index]?.diaChiChiTietChiNhanh && (
                        <p className="mt-1 text-xs text-red-500">{errors.chiNhanhs[index]?.diaChiChiTietChiNhanh?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-900">Tỉnh/thành</label>
                      <select
                        {...register(`chiNhanhs.${index}.tinhThanhId`, {
                          onChange: () => {
                            setValue(`chiNhanhs.${index}.tenXaPhuong`, "");
                          },
                        })}
                        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
                      >
                        <option value="">Chọn tỉnh/thành</option>
                        {provinceOptions.map((province) => (
                          <option key={province.value} value={province.value}>
                            {province.label}
                          </option>
                        ))}
                      </select>
                      {errors.chiNhanhs?.[index]?.tinhThanhId && (
                        <p className="mt-1 text-xs text-red-500">{errors.chiNhanhs[index]?.tinhThanhId?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-900">Phường/Xã</label>
                      <select
                        {...register(`chiNhanhs.${index}.tenXaPhuong`)}
                        disabled={!watchedBranches?.[index]?.tinhThanhId || wardLoadingProvinceIds.includes(Number(watchedBranches?.[index]?.tinhThanhId))}
                        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100"
                      >
                        <option value="">
                          {!watchedBranches?.[index]?.tinhThanhId
                            ? "Chọn tỉnh/thành trước"
                            : wardLoadingProvinceIds.includes(Number(watchedBranches?.[index]?.tinhThanhId))
                              ? "Đang tải phường/xã..."
                              : "Chọn phường/xã"}
                        </option>
                        {(wardOptionsByProvinceId[Number(watchedBranches?.[index]?.tinhThanhId)] ?? []).map((ward) => (
                          <option key={ward.id} value={ward.ten}>
                            {ward.ten}
                          </option>
                        ))}
                      </select>
                      {errors.chiNhanhs?.[index]?.tenXaPhuong && (
                        <p className="mt-1 text-xs text-red-500">{errors.chiNhanhs[index]?.tenXaPhuong?.message}</p>
                      )}
                    </div>
                  </div>

                  {watchedBranches?.[index]?.tinhThanhId ? (
                    <p className="mt-3 text-xs text-slate-500">
                      Tỉnh/thành đã chọn: {getProvinceLabel(watchedBranches[index]?.tinhThanhId)}
                    </p>
                  ) : null}
                </article>
              ))}

              {errors.chiNhanhs && typeof errors.chiNhanhs.message === "string" ? (
                <p className="text-sm text-red-500">{errors.chiNhanhs.message}</p>
              ) : null}
            </div>
          </section>

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
                    if (e.target.files?.[0]) {
                      setFileName(e.target.files[0].name);
                    }
                  }}
                />
                <Upload className="mx-auto mb-2 text-slate-400 group-hover:text-blue-500" size={32} />
                <p className="text-sm text-slate-600">
                  {fileName ? <span className="font-bold text-blue-600">{fileName}</span> : "Tải lên Giấy phép kinh doanh hoặc MST"}
                </p>
                <p className="mt-2 text-xs text-slate-400">Hỗ trợ PDF, JPG, PNG (Tối đa 10MB)</p>
              </div>
              {errors.tepMinhChung && <p className="mt-1 text-xs text-red-500">{errors.tepMinhChung.message as string}</p>}
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs leading-relaxed text-blue-800">
                Tài khoản công ty cần được quản trị viên phê duyệt dựa trên tài liệu minh chứng bạn cung cấp trước khi có thể đăng tin.
              </p>
            </div>
          </section>

          <div className="flex items-center justify-end border-t border-slate-100 pt-6">
            <Button type="submit" size="lg" disabled={isLoading} className="px-16 text-base font-bold">
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Gửi yêu cầu đăng ký"}
            </Button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService, type RegisterOwnerPayload } from "@/services/auth.service";
import { locationService, type Province, type Ward } from "@/services/location.service";
import { defaultBranch, ownerRegisterSchema, type OwnerFormValues } from "../components/types";

// Dùng cho màn auth/register/owner: quản lý form đăng ký owner + tải tỉnh/thành và phường/xã theo chi nhánh.
export function useOwnerRegister() {
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
    locationService
      .getProvinces()
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
          .filter((provinceId) => Number.isInteger(provinceId) && provinceId > 0 && !wardOptionsByProvinceId[provinceId]),
      ),
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
          })),
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
    [provinces],
  );

  const getProvinceLabel = (provinceId?: string) => {
    if (!provinceId) {
      return "--";
    }
    return provinceOptions.find((province) => province.value === provinceId)?.label ?? "--";
  };

  return {
    isLoading,
    fileName,
    wardOptionsByProvinceId,
    wardLoadingProvinceIds,
    primaryBranchIndex,
    register,
    control,
    setValue,
    handleSubmit,
    errors,
    fields,
    watchedBranches,
    provinceOptions,
    setFileName,
    setPrimaryBranchIndex,
    onSubmit,
    addBranch,
    removeBranch,
    getProvinceLabel,
  };
}

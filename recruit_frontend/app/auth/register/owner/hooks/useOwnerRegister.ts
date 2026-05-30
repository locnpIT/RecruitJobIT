"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService, type OwnerProofTypeOption, type RegisterOwnerPayload } from "@/services/auth/auth.service";
import { locationService, type Province, type Ward } from "@/services/common/location.service";
import { defaultBranch, ownerRegisterSchema, type OwnerFormValues } from "../components/types";
import type { OwnerProofRow } from "../components/OwnerProofUploadSection";

// Dùng cho màn auth/register/owner: quản lý form đăng ký owner + tải tỉnh/thành, phường/xã
// và danh sách nhiều minh chứng doanh nghiệp.
export function useOwnerRegister() {
  const [isLoading, setIsLoading] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wardOptionsByProvinceId, setWardOptionsByProvinceId] = useState<Record<number, Ward[]>>({});
  const [wardLoadingProvinceIds, setWardLoadingProvinceIds] = useState<number[]>([]);
  const [primaryBranchIndex, setPrimaryBranchIndex] = useState(0);
  const [proofTypes, setProofTypes] = useState<OwnerProofTypeOption[]>([]);
  const [proofTypesLoading, setProofTypesLoading] = useState(true);
  const [nextProofRowId, setNextProofRowId] = useState(2);
  const [proofRows, setProofRows] = useState<OwnerProofRow[]>([{ id: 1, loaiTaiLieuId: "", file: null }]);
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

  const defaultProofTypeId = useMemo(() => {
    const firstId = proofTypes.find((item) => item.id != null)?.id;
    return firstId == null ? "" : String(firstId);
  }, [proofTypes]);

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
    let active = true;

    authService
      .getOwnerProofTypes()
      .then((items) => {
        if (!active) {
          return;
        }
        setProofTypes(items);
        const firstId = items.find((item) => item.id != null)?.id;
        if (firstId != null) {
          const defaultId = String(firstId);
          setProofRows((current) =>
            current.map((row) => (row.loaiTaiLieuId ? row : { ...row, loaiTaiLieuId: defaultId })),
          );
        }
      })
      .catch(() => {
        if (!active) {
          return;
        }
        toast.error("Không tải được danh sách loại tài liệu.");
      })
      .finally(() => {
        if (active) {
          setProofTypesLoading(false);
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
    setProofError(null);

    try {
      const hasPartialProof = proofRows.some((row) => (row.file && !row.loaiTaiLieuId) || (!row.file && row.loaiTaiLieuId));
      if (hasPartialProof) {
        throw new Error("Mỗi minh chứng cần chọn đủ loại tài liệu và tệp.");
      }

      const rowsToUpload = proofRows.filter((row) => row.file && row.loaiTaiLieuId);
      if (rowsToUpload.length === 0) {
        throw new Error("Vui lòng thêm ít nhất một minh chứng doanh nghiệp.");
      }

      const uploadedProofs: RegisterOwnerPayload["minhChungs"] = [];
      for (const row of rowsToUpload) {
        const signatureData = await authService.getCloudinarySignature("proof");
        const file = row.file as File;
        const fileUrl = await authService.uploadToCloudinary(file, signatureData);
        uploadedProofs.push({
          loaiTaiLieuId: Number(row.loaiTaiLieuId),
          duongDanMinhChung: fileUrl,
          tenTep: file.name,
        });
      }

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
        minhChungs: uploadedProofs,
      };

      await authService.registerOwner(payload);
      toast.success("Đăng ký công ty thành công! Đang chờ duyệt.");
      router.push("/auth/login");
    } catch (error: unknown) {
      const backendMessage =
        typeof error === "object" && error !== null && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      const message = backendMessage ?? (error instanceof Error ? error.message : "Đăng ký thất bại. Vui lòng thử lại.");
      setProofError(message.includes("minh chứng") ? message : null);
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

  const addProofRow = () => {
    setProofRows((current) => [...current, { id: nextProofRowId, loaiTaiLieuId: defaultProofTypeId, file: null }]);
    setNextProofRowId((current) => current + 1);
  };

  const removeProofRow = (rowId: number) => {
    setProofRows((current) => {
      if (current.length === 1) {
        return current;
      }
      return current.filter((row) => row.id !== rowId);
    });
  };

  const updateProofType = (rowId: number, nextTypeId: string) => {
    setProofRows((current) =>
      current.map((row) => (row.id === rowId ? { ...row, loaiTaiLieuId: nextTypeId } : row)),
    );
  };

  const updateProofFile = (rowId: number, nextFile: File | null) => {
    setProofRows((current) => current.map((row) => (row.id === rowId ? { ...row, file: nextFile } : row)));
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
    proofError,
    wardOptionsByProvinceId,
    wardLoadingProvinceIds,
    primaryBranchIndex,
    proofTypes,
    proofTypesLoading,
    proofRows,
    register,
    control,
    setValue,
    handleSubmit,
    errors,
    fields,
    watchedBranches,
    provinceOptions,
    setPrimaryBranchIndex,
    onSubmit,
    addBranch,
    removeBranch,
    addProofRow,
    removeProofRow,
    updateProofType,
    updateProofFile,
    getProvinceLabel,
  };
}

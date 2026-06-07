"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService, type RegisterOwnerPayload } from "@/services/auth/auth.service";
import { defaultBranch, ownerRegisterSchema, type OwnerFormValues } from "../components/types";
import { useLocationData } from "./useLocationData";
import { useOwnerProofRows } from "./useOwnerProofRows";

// Orchestrator: kết hợp form đăng ký owner, location data và proof rows.
export function useOwnerRegister() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);
  const [primaryBranchIndex, setPrimaryBranchIndex] = useState(0);

  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<OwnerFormValues>({
    resolver: zodResolver(ownerRegisterSchema),
    defaultValues: { chiNhanhs: [defaultBranch] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "chiNhanhs" });
  const watchedBranches = useWatch({ control, name: "chiNhanhs" });

  const location = useLocationData(watchedBranches);
  const proofState = useOwnerProofRows();

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

  const onSubmit = async (data: OwnerFormValues) => {
    setIsLoading(true);
    setProofError(null);

    try {
      const hasPartialProof = proofState.proofRows.some(
        (row) => (row.file && !row.loaiTaiLieuId) || (!row.file && row.loaiTaiLieuId),
      );
      if (hasPartialProof) {
        throw new Error("Mỗi minh chứng cần chọn đủ loại tài liệu và tệp.");
      }

      const rowsToUpload = proofState.proofRows.filter((row) => row.file && row.loaiTaiLieuId);
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
      const message =
        backendMessage ?? (error instanceof Error ? error.message : "Đăng ký thất bại. Vui lòng thử lại.");
      setProofError(message.includes("minh chứng") ? message : null);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    proofError,
    primaryBranchIndex,
    register,
    control,
    setValue,
    handleSubmit,
    errors,
    fields,
    watchedBranches,
    setPrimaryBranchIndex,
    onSubmit,
    addBranch,
    removeBranch,
    // từ useLocationData
    wardOptionsByProvinceId: location.wardOptionsByProvinceId,
    wardLoadingProvinceIds: location.wardLoadingProvinceIds,
    provinceOptions: location.provinceOptions,
    getProvinceLabel: location.getProvinceLabel,
    // từ useOwnerProofRows
    proofTypes: proofState.proofTypes,
    proofTypesLoading: proofState.proofTypesLoading,
    proofRows: proofState.proofRows,
    addProofRow: proofState.addProofRow,
    removeProofRow: proofState.removeProofRow,
    updateProofType: proofState.updateProofType,
    updateProofFile: proofState.updateProofFile,
  };
}

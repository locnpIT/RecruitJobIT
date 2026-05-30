"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import { companyAdminService } from "@/services/company-admin/company-admin.service";
import type {
  CompanyPackageOverview,
  CompanyPackagePlan,
  CompanyPackageRegistration,
} from "@/services/company-admin/types";

type UseCompanyAdminPackagesActionsParams = {
  setOverview: Dispatch<SetStateAction<CompanyPackageOverview | null>>;
  setLatestPayment: Dispatch<SetStateAction<CompanyPackageRegistration | null>>;
};

// Dùng cho màn company-admin/packages: thao tác đăng ký gói và cập nhật snapshot payment hiện tại.
export function useCompanyAdminPackagesActions({ setOverview, setLatestPayment }: UseCompanyAdminPackagesActionsParams) {
  const [isSubmitting, setIsSubmitting] = useState<number | null>(null);

  const handleRegister = async (plan: CompanyPackagePlan) => {
    if (!plan.id) {
      toast.error("Gói không hợp lệ.");
      return;
    }

    setIsSubmitting(plan.id);
    try {
      const updated = await companyAdminService.registerCompanyPackage(plan.id);
      setLatestPayment(updated);
      setOverview((current) =>
        current
          ? {
              ...current,
              goiHienTai: updated,
              coQuyenDangBai: updated.coHieuLuc,
            }
          : current,
      );
      toast.success("Đã tạo QR thanh toán SePay. Vui lòng quét mã để chuyển khoản.");
    } catch (err) {
      const message =
        typeof err === "object" && err !== null && "response" in err
          ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Không thể đăng ký gói.")
          : "Không thể đăng ký gói.";
      toast.error(message);
    } finally {
      setIsSubmitting(null);
    }
  };

  return {
    isSubmitting,
    handleRegister,
  };
}

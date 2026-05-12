"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  companyAdminService,
  type CompanyAdminMeResponse,
  type CompanyPackageOverview,
  type CompanyPackagePlan,
  type CompanyPackageRegistration,
} from "@/services/company-admin.service";
import { isCompanyApproved } from "../company-admin-status";
import { CompanyAdminRestrictedNotice } from "../components/CompanyAdminRestrictedNotice";
import { CurrentPlanSection } from "./components/CurrentPlanSection";
import { PackageCardsSection } from "./components/PackageCardsSection";
import { PackagesHeader } from "./components/PackagesHeader";
import { SepayPaymentSection } from "./components/SepayPaymentSection";

// Màn gói dịch vụ của công ty.
// Chịu trách nhiệm hiển thị gói hiện tại, danh sách gói mở bán và khởi tạo luồng thanh toán SePay.
export default function CompanyAdminPackagesPage() {
  const [me, setMe] = useState<CompanyAdminMeResponse | null>(null);
  const [overview, setOverview] = useState<CompanyPackageOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latestPayment, setLatestPayment] = useState<CompanyPackageRegistration | null>(null);

  useEffect(() => {
    let active = true;

    companyAdminService
      .getMe()
      .then(async (meResponse) => {
        if (!active) return;
        setMe(meResponse);

        const isOwner = meResponse.chiNhanhs?.some((branch) => branch.vaiTroCongTy?.toUpperCase() === "OWNER") ?? false;
        if (!isOwner || !isCompanyApproved(meResponse.congTy.trangThai)) {
          return;
        }

        const packageResponse = await companyAdminService.getCompanyPackages();
        if (!active) return;
        setOverview(packageResponse);
      })
      .catch(() => {
        if (!active) return;
        setError("Không tải được dữ liệu gói công ty.");
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const company = me?.congTy ?? null;
  const isApproved = isCompanyApproved(company?.trangThai);
  const isOwner = useMemo(
    () => me?.chiNhanhs?.some((branch) => branch.vaiTroCongTy?.toUpperCase() === "OWNER") ?? false,
    [me?.chiNhanhs]
  );

  useEffect(() => {
    if (!latestPayment?.id) {
      return;
    }

    const paidStatuses = new Set(["PAID", "SUCCESS", "COMPLETED", "DONE"]);
    const currentStatus = latestPayment.trangThaiThanhToan?.toUpperCase() ?? "";
    if (paidStatuses.has(currentStatus)) {
      return;
    }

    let stopped = false;
    const intervalId = window.setInterval(async () => {
      try {
        const refreshed = await companyAdminService.getCompanyPackages();
        if (stopped) {
          return;
        }

        setOverview(refreshed);
        const currentPackage = refreshed.goiHienTai;
        if (!currentPackage || currentPackage.id !== latestPayment.id) {
          return;
        }

        setLatestPayment(currentPackage);
        const refreshedStatus = currentPackage.trangThaiThanhToan?.toUpperCase() ?? "";
        if (paidStatuses.has(refreshedStatus)) {
          toast.success("Thanh toán thành công. Gói đã được kích hoạt.");
          window.clearInterval(intervalId);
        }
      } catch {
        // Keep polling on transient errors.
      }
    }, 5000);

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  }, [latestPayment]);

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
          : current
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

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Đang tải gói công ty...
      </div>
    );
  }

  if (error || !me) {
    return <div className="border border-rose-200 px-4 py-3 text-sm text-rose-700">{error ?? "Không có dữ liệu."}</div>;
  }

  if (!isOwner) {
    return <CompanyAdminRestrictedNotice title="Chỉ OWNER mới được quản lý gói công ty" tone="danger" />;
  }

  if (!isApproved) {
    return <CompanyAdminRestrictedNotice title="Công ty chưa được duyệt" />;
  }

  if (!overview) {
    return <div className="border border-rose-200 px-4 py-3 text-sm text-rose-700">Không có dữ liệu gói.</div>;
  }

  return (
    <div className="space-y-6 text-slate-900">
      <PackagesHeader />
      <CurrentPlanSection currentPlan={overview.goiHienTai} />

      {(latestPayment?.paymentCode || latestPayment?.qrImageUrl) && (
        <SepayPaymentSection payment={latestPayment} />
      )}

      <PackageCardsSection
        plans={overview.danhSachGoi}
        currentPlan={overview.goiHienTai}
        submittingPlanId={isSubmitting}
        onRegister={handleRegister}
      />
    </div>
  );
}

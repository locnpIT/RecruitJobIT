"use client";

import { Loader2 } from "lucide-react";
import { CompanyAdminRestrictedNotice } from "../../components/CompanyAdminRestrictedNotice";
import { CurrentPlanSection } from "./CurrentPlanSection";
import { PackageCardsSection } from "./PackageCardsSection";
import { PackagesHeader } from "./PackagesHeader";
import { SepayPaymentSection } from "./SepayPaymentSection";
import { useCompanyAdminPackagesActions } from "../hooks/useCompanyAdminPackagesActions";
import { useCompanyAdminPackagesData } from "../hooks/useCompanyAdminPackagesData";

// Client container cho trang /company-admin/packages.
export function CompanyAdminPackagesClient() {
  const data = useCompanyAdminPackagesData();
  const actions = useCompanyAdminPackagesActions({
    setOverview: data.setOverview,
    setLatestPayment: data.setLatestPayment,
  });

  if (data.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Đang tải gói công ty...
      </div>
    );
  }

  if (data.error || !data.me) {
    return <div className="border border-rose-200 px-4 py-3 text-sm text-rose-700">{data.error ?? "Không có dữ liệu."}</div>;
  }

  if (!data.isOwner) {
    return <CompanyAdminRestrictedNotice title="Chỉ OWNER mới được quản lý gói công ty" tone="danger" />;
  }

  if (!data.isApproved) {
    return <CompanyAdminRestrictedNotice title="Công ty chưa được duyệt" />;
  }

  if (!data.overview) {
    return <div className="border border-rose-200 px-4 py-3 text-sm text-rose-700">Không có dữ liệu gói.</div>;
  }

  return (
    <div className="space-y-6 text-slate-900">
      <PackagesHeader />
      <CurrentPlanSection currentPlan={data.overview.goiHienTai} />

      {(data.latestPayment?.paymentCode || data.latestPayment?.qrImageUrl) && (
        <SepayPaymentSection payment={data.latestPayment} />
      )}

      <PackageCardsSection
        plans={data.overview.danhSachGoi}
        currentPlan={data.overview.goiHienTai}
        submittingPlanId={actions.isSubmitting}
        onRegister={actions.handleRegister}
      />
    </div>
  );
}

"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { isCompanyApproved } from "../../company-admin-status";
import { CompanyAdminRestrictedNotice } from "../../components/CompanyAdminRestrictedNotice";
import { CompanyInfoSection } from "./CompanyInfoSection";
import { CompanyLogoSection } from "./CompanyLogoSection";
import { CompanyProofsSection } from "./CompanyProofsSection";
import { CompanyResubmitSection } from "./CompanyResubmitSection";
import { SettingsPageHeader } from "./SettingsPageHeader";
import { useCompanyAdminSettingsData } from "../hooks/useCompanyAdminSettingsData";
import { useCompanyAdminSettingsActions } from "../hooks/useCompanyAdminSettingsActions";

// Client container cho trang company-admin/settings.
export function CompanyAdminSettingsClient() {
  const dataState = useCompanyAdminSettingsData();
  const actions = useCompanyAdminSettingsActions({
    data: dataState.data,
    form: dataState.form,
    setData: dataState.setData,
    proofRows: dataState.proofRowsState.proofRows,
    proofTypes: dataState.proofTypes,
    resetProofRows: dataState.proofRowsState.resetProofRows,
  });

  if (dataState.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Đang tải tuỳ chỉnh...
      </div>
    );
  }

  if (dataState.error || !dataState.data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        {dataState.error ?? "Không có dữ liệu công ty."}
      </div>
    );
  }

  const companyApproved = isCompanyApproved(dataState.data.congTy.trangThai);
  const companyRejected = dataState.data.congTy.trangThai?.toUpperCase() === "REJECTED";
  const companyLogo = dataState.data.congTy.logoUrl ?? null;

  return (
    <div className="space-y-8 text-slate-900">
      <SettingsPageHeader companyName={dataState.data.congTy.ten ?? "Công ty chưa có tên"} />

      {!companyApproved ? (
        <CompanyAdminRestrictedNotice
          title={companyRejected ? "Hồ sơ công ty bị từ chối" : "Công ty đang chờ duyệt"}
          tone={companyRejected ? "danger" : "success"}
          description={
            companyRejected
              ? `Lý do từ chối: ${dataState.data.congTy.lyDoTuChoi ?? "Chưa có lý do"}`
              : "Công ty đang chờ duyệt. Bạn vẫn có thể cập nhật thông tin và logo."
          }
        />
      ) : null}

      <section className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <CompanyInfoSection form={dataState.form} onChange={dataState.setForm} />
          <CompanyProofsSection
            companyApproved={companyApproved}
            proofTypes={dataState.proofTypes}
            proofRows={dataState.proofRowsState.proofRows}
            isSavingProofs={actions.isSavingProofs}
            onAddRow={() => dataState.proofRowsState.addProofRow(dataState.proofTypes[0]?.id ?? null)}
            onRemoveRow={(rowId) => dataState.proofRowsState.removeProofRow(rowId, dataState.proofTypes[0]?.id ?? null)}
            onUpdateRow={dataState.proofRowsState.updateProofRow}
            onUploadAll={() => {
              void actions
                .handleUploadProofs()
                .then((count) => {
                  toast.success(`Đã tải lên ${count} minh chứng.`);
                })
                .catch((error) => {
                  toast.error(error instanceof Error ? error.message : "Không thể tải lên minh chứng.");
                });
            }}
          />
          <CompanyResubmitSection
            isResubmitting={actions.isResubmitting}
            onResubmit={() => {
              const confirmed = window.confirm("Bạn muốn gửi hồ sơ công ty duyệt lại ngay bây giờ?");
              if (!confirmed) {
                return;
              }

              void actions
                .handleResubmit()
                .then(() => {
                  toast.success("Đã gửi duyệt lại công ty.");
                })
                .catch((error) => {
                  toast.error(error instanceof Error ? error.message : "Không thể gửi duyệt lại công ty.");
                });
            }}
          />
        </div>

        <CompanyLogoSection
          companyLogo={companyLogo}
          logoPreview={actions.logoPreview}
          isSaving={actions.isSaving}
          onChangeFile={actions.handleLogoChange}
          onUpload={() => {
            void actions
              .handleUploadLogo()
              .then(() => {
                toast.success("Đã cập nhật logo công ty.");
              })
              .catch((error) => {
                toast.error(error instanceof Error ? error.message : "Không thể cập nhật logo công ty.");
              });
          }}
        />
      </section>
    </div>
  );
}

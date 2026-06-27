"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "../../components/PageHeader";
import { CatalogCrudSection } from "./CatalogCrudSection";
import { useAdminCatalogsActions } from "../hooks/useAdminCatalogsActions";
import { type CatalogKey, useAdminCatalogsData } from "../hooks/useAdminCatalogsData";

type CatalogConfig = {
  key: CatalogKey;
  label: string;
  description: string;
  ruleNote?: string;
};

const CATALOGS: CatalogConfig[] = [
  {
    key: "systemRoles",
    label: "Vai trò hệ thống",
    description: "Quản lý bảng VaiTroHeThong.",
    ruleNote: "Role lõi ADMIN và USER không được đổi tên hoặc xoá.",
  },
  {
    key: "companyRoles",
    label: "Vai trò công ty",
    description: "Quản lý bảng VaiTroCongTy.",
    ruleNote: "Role lõi OWNER, HR, MASTER_BRANCH không được đổi tên hoặc xoá.",
  },
  {
    key: "proofTypes",
    label: "Loại tài liệu công ty",
    description: "Quản lý bảng LoaiTaiLieu.",
    ruleNote: "Type lõi BUSINESS_REGISTRATION, TAX_CERTIFICATE, OWNER_ID_CARD, OTHER không được đổi tên hoặc xoá.",
  },
  {
    key: "certificateTypes",
    label: "Loại chứng chỉ",
    description: "Quản lý bảng LoaiChungChi cho metadata hồ sơ ứng viên.",
  },
];

export function CatalogsAdminClient() {
  const data = useAdminCatalogsData();
  const actions = useAdminCatalogsActions({ onReload: data.loadAll });
  const { actionError, actionSuccess, setActionError, setActionSuccess } = actions;

  useEffect(() => {
    if (data.error) {
      toast.error(data.error);
    }
  }, [data.error]);

  useEffect(() => {
    if (actionError) {
      toast.error(actionError);
      setActionError(null);
    }
  }, [actionError, setActionError]);

  useEffect(() => {
    if (actionSuccess) {
      toast.success(actionSuccess);
      setActionSuccess(null);
    }
  }, [actionSuccess, setActionSuccess]);

  const activeConfig = CATALOGS.find((item) => item.key === data.activeTab) ?? CATALOGS[0];
  const activeItems = data.data[activeConfig.key];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Hệ thống"
        title="Quản lý Danh Mục"
        subtitle={`Quản trị 4 nhóm danh mục nền tảng. Tổng số item hiện có: ${data.totalItems}.`}
        actions={
          <Button type="button" variant="outline" onClick={() => void data.loadAll(true)} disabled={data.loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
        }
      />

      <section className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {CATALOGS.map((item) => {
            const isActive = item.key === data.activeTab;
            const itemCount = data.data[item.key].length;
            return (
              <Button variant="unstyled"
                key={item.key}
                type="button"
                onClick={() => data.setActiveTab(item.key)}
                className={`border px-3 py-3 text-left transition ${
                  isActive
                    ? "bg-[#008080] text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <p className="text-sm font-semibold">{item.label}</p>
                <p className={`mt-1 text-xs ${isActive ? "text-slate-200" : "text-slate-500"}`}>{itemCount} item</p>
              </Button>
            );
          })}
        </div>
      </section>

      <CatalogCrudSection
        title={activeConfig.label}
        description={activeConfig.description}
        ruleNote={activeConfig.ruleNote}
        loading={data.loading}
        items={activeItems}
        saving={actions.saving[activeConfig.key]}
        deletingId={actions.deletingId[activeConfig.key]}
        onCreate={(payload) => actions.onCreate(activeConfig.key, payload)}
        onUpdate={(id, payload) => actions.onUpdate(activeConfig.key, id, payload)}
        onDelete={(id) => actions.onDelete(activeConfig.key, id)}
      />
    </div>
  );
}

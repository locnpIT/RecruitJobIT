"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { adminService, type AdminCatalogItem } from "@/services/admin.service";
import { PageHeader } from "../components/PageHeader";
import { CatalogCrudSection } from "./components/CatalogCrudSection";

type CatalogKey = "systemRoles" | "companyRoles" | "proofTypes" | "certificateTypes";
type CatalogState = Record<CatalogKey, AdminCatalogItem[]>;
type BusyState = Record<CatalogKey, boolean>;
type DeletingState = Record<CatalogKey, number | null>;

type CatalogConfig = {
  key: CatalogKey;
  label: string;
  description: string;
  ruleNote?: string;
};

const EMPTY_DATA: CatalogState = {
  systemRoles: [],
  companyRoles: [],
  proofTypes: [],
  certificateTypes: [],
};

const EMPTY_BUSY: BusyState = {
  systemRoles: false,
  companyRoles: false,
  proofTypes: false,
  certificateTypes: false,
};

const EMPTY_DELETING: DeletingState = {
  systemRoles: null,
  companyRoles: null,
  proofTypes: null,
  certificateTypes: null,
};

const CATALOGS: CatalogConfig[] = [
  {
    key: "systemRoles",
    label: "Vai trò hệ thống",
    description: "Quản lý bảng VaiTroHeThong.",
    ruleNote: "Role lõi ADMIN và CANDIDATE không được đổi tên hoặc xoá.",
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
  const [data, setData] = useState<CatalogState>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<BusyState>(EMPTY_BUSY);
  const [deletingId, setDeletingId] = useState<DeletingState>(EMPTY_DELETING);
  const [activeTab, setActiveTab] = useState<CatalogKey>("systemRoles");

  const loadAll = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const [systemRoles, companyRoles, proofTypes, certificateTypes] = await Promise.all([
        adminService.listSystemRoles(),
        adminService.listCompanyRoles(),
        adminService.listProofTypes(),
        adminService.listCertificateTypes(),
      ]);
      setData({
        systemRoles,
        companyRoles,
        proofTypes,
        certificateTypes,
      });
    } catch (error) {
      toast.error(readErrorMessage(error, "Không tải được danh mục hệ thống."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAll();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const totalItems = useMemo(() => {
    return Object.values(data).reduce((sum, items) => sum + items.length, 0);
  }, [data]);

  const activeConfig = CATALOGS.find((item) => item.key === activeTab) ?? CATALOGS[0];
  const activeItems = data[activeConfig.key];

  const onCreate = async (
    key: CatalogKey,
    payload: { ten: string; moTa: string },
  ) => {
    setSaving((prev) => ({ ...prev, [key]: true }));
    try {
      if (key === "systemRoles") await adminService.createSystemRole(payload);
      if (key === "companyRoles") await adminService.createCompanyRole(payload);
      if (key === "proofTypes") await adminService.createProofType(payload);
      if (key === "certificateTypes") await adminService.createCertificateType(payload);
      toast.success("Đã thêm danh mục.");
      await loadAll();
    } catch (error) {
      toast.error(readErrorMessage(error, "Không thể thêm danh mục."));
      throw error;
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const onUpdate = async (
    key: CatalogKey,
    id: number,
    payload: { ten: string; moTa: string },
  ) => {
    setSaving((prev) => ({ ...prev, [key]: true }));
    try {
      if (key === "systemRoles") await adminService.updateSystemRole(id, payload);
      if (key === "companyRoles") await adminService.updateCompanyRole(id, payload);
      if (key === "proofTypes") await adminService.updateProofType(id, payload);
      if (key === "certificateTypes") await adminService.updateCertificateType(id, payload);
      toast.success("Đã cập nhật danh mục.");
      await loadAll();
    } catch (error) {
      toast.error(readErrorMessage(error, "Không thể cập nhật danh mục."));
      throw error;
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const onDelete = async (key: CatalogKey, id: number) => {
    const confirmed = window.confirm("Xác nhận xoá danh mục này?");
    if (!confirmed) {
      return;
    }
    setDeletingId((prev) => ({ ...prev, [key]: id }));
    try {
      if (key === "systemRoles") await adminService.deleteSystemRole(id);
      if (key === "companyRoles") await adminService.deleteCompanyRole(id);
      if (key === "proofTypes") await adminService.deleteProofType(id);
      if (key === "certificateTypes") await adminService.deleteCertificateType(id);
      toast.success("Đã xoá danh mục.");
      await loadAll();
    } catch (error) {
      toast.error(readErrorMessage(error, "Không thể xoá danh mục."));
    } finally {
      setDeletingId((prev) => ({ ...prev, [key]: null }));
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Hệ thống"
        title="CRUD Danh Mục"
        subtitle={`Quản trị 4 nhóm danh mục nền tảng. Tổng số item hiện có: ${totalItems}.`}
        actions={
          <Button type="button" variant="outline" onClick={() => void loadAll(true)} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
        }
      />

      <section className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {CATALOGS.map((item) => {
            const isActive = item.key === activeTab;
            const itemCount = data[item.key].length;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`rounded-lg border px-3 py-3 text-left transition ${
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <p className="text-sm font-semibold">{item.label}</p>
                <p className={`mt-1 text-xs ${isActive ? "text-slate-200" : "text-slate-500"}`}>{itemCount} item</p>
              </button>
            );
          })}
        </div>
      </section>

      <CatalogCrudSection
        title={activeConfig.label}
        description={activeConfig.description}
        ruleNote={activeConfig.ruleNote}
        loading={loading}
        items={activeItems}
        saving={saving[activeConfig.key]}
        deletingId={deletingId[activeConfig.key]}
        onCreate={(payload) => onCreate(activeConfig.key, payload)}
        onUpdate={(id, payload) => onUpdate(activeConfig.key, id, payload)}
        onDelete={(id) => onDelete(activeConfig.key, id)}
      />
    </div>
  );
}

function readErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  return fallback;
}

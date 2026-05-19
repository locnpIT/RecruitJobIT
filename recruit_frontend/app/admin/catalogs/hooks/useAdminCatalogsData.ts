"use client";

import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "@/lib/api-error";
import { adminCatalogsService } from "@/services/admin/catalogs.service";
import type { AdminCatalogItem } from "@/services/admin/types";

export type CatalogKey = "systemRoles" | "companyRoles" | "proofTypes" | "certificateTypes";
type CatalogState = Record<CatalogKey, AdminCatalogItem[]>;

const EMPTY_DATA: CatalogState = {
  systemRoles: [],
  companyRoles: [],
  proofTypes: [],
  certificateTypes: [],
};

// Dùng cho màn admin/catalogs: nạp 4 nhóm danh mục và state tab active.
export function useAdminCatalogsData() {
  const [data, setData] = useState<CatalogState>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CatalogKey>("systemRoles");

  const loadAll = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    try {
      const [systemRoles, companyRoles, proofTypes, certificateTypes] = await Promise.all([
        adminCatalogsService.listSystemRoles(),
        adminCatalogsService.listCompanyRoles(),
        adminCatalogsService.listProofTypes(),
        adminCatalogsService.listCertificateTypes(),
      ]);
      setData({
        systemRoles,
        companyRoles,
        proofTypes,
        certificateTypes,
      });
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Không tải được danh mục hệ thống."));
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

  return {
    data,
    loading,
    error,
    activeTab,
    totalItems,
    setActiveTab,
    loadAll,
  };
}

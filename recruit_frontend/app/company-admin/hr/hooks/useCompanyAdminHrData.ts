"use client";

import { useEffect, useState } from "react";
import {
  companyAdminService,
} from "@/services/company-admin/company-admin.service";
import type { CompanyAdminBranch, CompanyAdminHrAccount } from "@/services/company-admin/types";
import { isCompanyApproved } from "../../company-admin-status";

// Dùng cho màn company-admin/hr: nạp dữ liệu trạng thái công ty + danh sách chi nhánh + danh sách HR.
export function useCompanyAdminHrData() {
  const [branches, setBranches] = useState<CompanyAdminBranch[]>([]);
  const [hrs, setHrs] = useState<CompanyAdminHrAccount[]>([]);
  const [hrStatusChart, setHrStatusChart] = useState({
    labels: ["Hoạt động", "Tạm khóa"],
    values: [0, 0],
    colors: ["#008080", "#64748b"],
  });
  const [hrBranchChart, setHrBranchChart] = useState({
    labels: [] as string[],
    values: [] as number[],
    colors: [] as string[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyStatus, setCompanyStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    companyAdminService
      .getMe()
      .then((response) => {
        if (!active) {
          return;
        }
        setCompanyStatus(response.congTy.trangThai ?? null);

        if (!isCompanyApproved(response.congTy.trangThai)) {
          return;
        }

        return Promise.all([companyAdminService.getBranches(), companyAdminService.getHrs()]).then(([branchData, hrData]) => {
          if (!active) {
            return;
          }
          setBranches(branchData);
          setHrs(hrData);
          const activeCount = hrData.filter((item) => item.dangHoatDong).length;
          setHrStatusChart({
            labels: ["Hoạt động", "Tạm khóa"],
            values: [activeCount, Math.max(hrData.length - activeCount, 0)],
            colors: ["#008080", "#64748b"],
          });

          const branchLabels = branchData
            .map((branch) => branch.chiNhanhTen ?? "--")
            .slice(0, 5);
          const branchValues = branchLabels.map((branchName) =>
            hrData.filter((hr) => hr.chiNhanhs?.some((branch) => branch.chiNhanhTen === branchName)).length,
          );
          setHrBranchChart({
            labels: branchLabels,
            values: branchValues,
            colors: branchLabels.map((_, index) => palette[index % palette.length]),
          });
        });
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setError("Không tải được dữ liệu nhân sự.");
      })
      .finally(() => {
        if (!active) {
          return;
        }
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return {
    branches,
    hrs,
    hrStatusChart,
    hrBranchChart,
    isLoading,
    error,
    companyStatus,
    setHrs,
  };
}

const palette = ["#0f766e", "#2563eb", "#f59e0b", "#8b5cf6", "#ef4444"];

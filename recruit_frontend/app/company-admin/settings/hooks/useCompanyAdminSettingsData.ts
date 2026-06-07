"use client";

import { useEffect, useState } from "react";
import { getApiErrorMessage } from "@/lib/api-error";
import { companyAdminSettingsService } from "@/services/company-admin/settings.service";
import type {
  CompanyAdminMeResponse,
  CompanyProofType,
} from "@/services/company-admin/types";
import { useCompanyProofRows } from "./useCompanyProofRows";
import type { CompanyInfoForm } from "../components/types";

const emptyForm: CompanyInfoForm = {
  tenCongTy: "",
  maSoThue: "",
  website: "",
  moTaCongTy: "",
};

// Dùng cho màn company-admin/settings: nạp dữ liệu công ty + danh mục minh chứng + state form.
export function useCompanyAdminSettingsData() {
  const [data, setData] = useState<CompanyAdminMeResponse | null>(null);
  const [form, setForm] = useState<CompanyInfoForm>(emptyForm);
  const [proofTypes, setProofTypes] = useState<CompanyProofType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const proofRowsState = useCompanyProofRows();
  const { applyDefaultTypeToEmptyRows } = proofRowsState;

  useEffect(() => {
    let active = true;

    companyAdminSettingsService
      .getMe()
      .then((response) => {
        if (!active) {
          return;
        }
        setData(response);
        setForm({
          tenCongTy: response.congTy.ten ?? "",
          maSoThue: response.congTy.maSoThue ?? "",
          website: response.congTy.website ?? "",
          moTaCongTy: response.congTy.moTa ?? "",
        });
        setError(null);
      })
      .catch((loadError) => {
        if (!active) {
          return;
        }
        setError(getApiErrorMessage(loadError, "Không tải được thông tin công ty."));
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

  useEffect(() => {
    let active = true;

    companyAdminSettingsService
      .getCompanyProofTypes()
      .then((types) => {
        if (!active) {
          return;
        }
        setProofTypes(types);
        applyDefaultTypeToEmptyRows(types);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setProofTypes([]);
      });

    return () => {
      active = false;
    };
  }, [applyDefaultTypeToEmptyRows]);

  return {
    data,
    setData,
    form,
    setForm,
    proofTypes,
    isLoading,
    error,
    proofRowsState,
  };
}

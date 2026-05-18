"use client";

import { useCallback, useState } from "react";
import type { CompanyProofType } from "@/services/company-admin.service";
import { createProofRow, type ProofRow } from "./types";

// Quản lý danh sách dòng minh chứng (thêm/xoá/cập nhật/reset) cho màn settings.
export function useCompanyProofRows() {
  const [proofRows, setProofRows] = useState<ProofRow[]>([createProofRow(null)]);

  const applyDefaultTypeToEmptyRows = useCallback((types: CompanyProofType[]) => {
    const defaultTypeId = types[0]?.id ?? null;
    setProofRows((current) =>
      current.map((row) => (row.loaiTaiLieuId == null ? { ...row, loaiTaiLieuId: defaultTypeId } : row))
    );
  }, []);

  const addProofRow = useCallback((defaultTypeId: number | null) => {
    setProofRows((current) => [...current, createProofRow(defaultTypeId)]);
  }, []);

  const removeProofRow = useCallback((rowId: string, defaultTypeId: number | null) => {
    setProofRows((current) => {
      const next = current.filter((row) => row.id !== rowId);
      return next.length > 0 ? next : [createProofRow(defaultTypeId)];
    });
  }, []);

  const updateProofRow = useCallback((rowId: string, updater: (row: ProofRow) => ProofRow) => {
    setProofRows((current) => current.map((row) => (row.id === rowId ? updater(row) : row)));
  }, []);

  const resetProofRows = useCallback((defaultTypeId: number | null) => {
    setProofRows([createProofRow(defaultTypeId)]);
  }, []);

  return {
    proofRows,
    addProofRow,
    removeProofRow,
    updateProofRow,
    resetProofRows,
    applyDefaultTypeToEmptyRows,
  };
}

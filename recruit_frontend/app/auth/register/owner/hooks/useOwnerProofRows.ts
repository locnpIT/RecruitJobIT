"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { authService, type OwnerProofTypeOption } from "@/services/auth/auth.service";
import type { OwnerProofRow } from "../components/OwnerProofUploadSection";

// Quản lý danh sách proof rows (loại tài liệu + file) và tải proof types từ API.
export function useOwnerProofRows() {
  const [proofTypes, setProofTypes] = useState<OwnerProofTypeOption[]>([]);
  const [proofTypesLoading, setProofTypesLoading] = useState(true);
  const [nextProofRowId, setNextProofRowId] = useState(2);
  const [proofRows, setProofRows] = useState<OwnerProofRow[]>([{ id: 1, loaiTaiLieuId: "", file: null }]);

  const defaultProofTypeId = useMemo(() => {
    const firstId = proofTypes.find((item) => item.id != null)?.id;
    return firstId == null ? "" : String(firstId);
  }, [proofTypes]);

  useEffect(() => {
    let active = true;
    authService
      .getOwnerProofTypes()
      .then((items) => {
        if (!active) return;
        setProofTypes(items);
        const firstId = items.find((item) => item.id != null)?.id;
        if (firstId != null) {
          const defaultId = String(firstId);
          setProofRows((current) =>
            current.map((row) => (row.loaiTaiLieuId ? row : { ...row, loaiTaiLieuId: defaultId })),
          );
        }
      })
      .catch(() => {
        if (!active) return;
        toast.error("Không tải được danh sách loại tài liệu.");
      })
      .finally(() => {
        if (active) setProofTypesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const addProofRow = () => {
    setProofRows((current) => [...current, { id: nextProofRowId, loaiTaiLieuId: defaultProofTypeId, file: null }]);
    setNextProofRowId((current) => current + 1);
  };

  const removeProofRow = (rowId: number) => {
    setProofRows((current) => {
      if (current.length === 1) return current;
      return current.filter((row) => row.id !== rowId);
    });
  };

  const updateProofType = (rowId: number, nextTypeId: string) => {
    setProofRows((current) =>
      current.map((row) => (row.id === rowId ? { ...row, loaiTaiLieuId: nextTypeId } : row)),
    );
  };

  const updateProofFile = (rowId: number, nextFile: File | null) => {
    setProofRows((current) => current.map((row) => (row.id === rowId ? { ...row, file: nextFile } : row)));
  };

  return { proofTypes, proofTypesLoading, proofRows, defaultProofTypeId, addProofRow, removeProofRow, updateProofType, updateProofFile };
}

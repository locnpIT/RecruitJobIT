"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "@/lib/api-error";
import { adminCandidateProofsService } from "@/services/admin/candidate-proofs.service";
import type { AdminCandidateProof } from "@/services/admin/types";

// Dùng cho màn admin/candidate-proofs: quản lý filter trạng thái + nạp danh sách + summary.
export function useAdminCandidateProofsData() {
  const [status, setStatus] = useState("PENDING");
  const [items, setItems] = useState<AdminCandidateProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminCandidateProofsService.listCandidateProofs({ status });
      setItems(data);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Không tải được danh sách minh chứng ứng viên."));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const summary = useMemo(
    () => ({
      total: items.length,
      education: items.filter((item) => item.loai === "EDUCATION").length,
      certificate: items.filter((item) => item.loai === "CERTIFICATE").length,
    }),
    [items],
  );

  return {
    status,
    items,
    loading,
    error,
    summary,
    setStatus,
    loadData,
  };
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { locationService, type Province, type Ward } from "@/services/common/location.service";

type WatchedBranch = { tinhThanhId?: string | number } | undefined;

// Tải danh sách tỉnh/thành một lần và lazy-load phường/xã theo từng tỉnh khi cần.
export function useLocationData(watchedBranches: WatchedBranch[] | null | undefined) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wardOptionsByProvinceId, setWardOptionsByProvinceId] = useState<Record<number, Ward[]>>({});
  const [wardLoadingProvinceIds, setWardLoadingProvinceIds] = useState<number[]>([]);

  useEffect(() => {
    let active = true;
    locationService
      .getProvinces()
      .then((response) => {
        if (active) setProvinces(response);
      })
      .catch(() => {
        if (active) toast.error("Không tải được danh sách tỉnh/thành.");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const provinceIdsToLoad = Array.from(
      new Set(
        (watchedBranches ?? [])
          .map((branch) => Number(branch?.tinhThanhId))
          .filter((id) => Number.isInteger(id) && id > 0 && !wardOptionsByProvinceId[id]),
      ),
    );

    if (provinceIdsToLoad.length === 0) {
      return;
    }

    let active = true;

    const loadWards = async () => {
      setWardLoadingProvinceIds((current) => Array.from(new Set([...current, ...provinceIdsToLoad])));
      try {
        const responses = await Promise.all(
          provinceIdsToLoad.map(async (provinceId) => ({
            provinceId,
            wards: await locationService.getWards(provinceId),
          })),
        );

        if (!active) return;

        setWardOptionsByProvinceId((current) => {
          const next = { ...current };
          responses.forEach(({ provinceId, wards }) => {
            next[provinceId] = wards;
          });
          return next;
        });
      } catch {
        if (active) toast.error("Không tải được danh sách phường/xã.");
      } finally {
        if (active) {
          setWardLoadingProvinceIds((current) => current.filter((id) => !provinceIdsToLoad.includes(id)));
        }
      }
    };

    void loadWards();
    return () => {
      active = false;
    };
  }, [watchedBranches, wardOptionsByProvinceId]);

  const provinceOptions = useMemo(
    () => provinces.map((province) => ({ value: String(province.id), label: province.ten })),
    [provinces],
  );

  const getProvinceLabel = (provinceId?: string) => {
    if (!provinceId) return "--";
    return provinceOptions.find((p) => p.value === provinceId)?.label ?? "--";
  };

  return { wardOptionsByProvinceId, wardLoadingProvinceIds, provinceOptions, getProvinceLabel };
}

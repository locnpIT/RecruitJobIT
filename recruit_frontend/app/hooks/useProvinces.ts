"use client";

import { useEffect, useState } from "react";
import { locationService, type Province } from "@/services/location.service";

// Dùng chung cho các form cần danh sách tỉnh/thành (homepage hero, jobs filters,...).
export function useProvinces() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(true);
  const [provinceError, setProvinceError] = useState("");

  useEffect(() => {
    let isMounted = true;

    locationService
      .getProvinces()
      .then((data) => {
        if (!isMounted) {
          return;
        }
        setProvinces(data);
        setProvinceError("");
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setProvinceError("Không tải được tỉnh/thành");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingProvinces(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    provinces,
    isLoadingProvinces,
    provinceError,
  };
}

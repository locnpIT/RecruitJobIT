"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { locationService, type Province, type Ward } from "@/services/common/location.service";
import type { UserProfileResponse } from "@/services/auth/auth.service";
import type { PersonalInfoFormState } from "../components/PersonalInfoPanel";

const INITIAL_FORM: PersonalInfoFormState = {
  soDienThoai: "",
  ngaySinh: "",
  gioiTinh: "",
  diaChiChiTiet: "",
  tinhThanhId: "",
  xaPhuongId: "",
};

// Quản lý state form thông tin cá nhân + dữ liệu tỉnh/thành, xã/phường.
export function useProfileLocationForm() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingWards, setLoadingWards] = useState(false);
  const [personalInfoForm, setPersonalInfoForm] = useState<PersonalInfoFormState>(INITIAL_FORM);

  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const data = await locationService.getProvinces();
        setProvinces(data);
      } catch {
        toast.error("Không tải được danh sách tỉnh/thành.");
      }
    };
    void loadProvinces();
  }, []);

  useEffect(() => {
    const tinhThanhId = Number(personalInfoForm.tinhThanhId);
    if (!tinhThanhId || Number.isNaN(tinhThanhId)) {
      return;
    }

    const loadWards = async () => {
      try {
        setLoadingWards(true);
        const data = await locationService.getWards(tinhThanhId);
        setWards(data);
      } catch {
        toast.error("Không tải được danh sách xã/phường.");
      } finally {
        setLoadingWards(false);
      }
    };
    void loadWards();
  }, [personalInfoForm.tinhThanhId]);

  const handlePersonalInfoFormChange = useCallback(
    (next: PersonalInfoFormState) => {
      if (next.tinhThanhId !== personalInfoForm.tinhThanhId) {
        setWards([]);
      }
      setPersonalInfoForm(next);
    },
    [personalInfoForm.tinhThanhId]
  );

  const hydratePersonalInfoFromMe = useCallback((me: UserProfileResponse) => {
    setPersonalInfoForm({
      soDienThoai: me.soDienThoai ?? "",
      ngaySinh: me.ngaySinh ?? "",
      gioiTinh: me.gioiTinh ?? "",
      diaChiChiTiet: me.diaChiChiTiet ?? "",
      tinhThanhId: me.tinhThanhId ? String(me.tinhThanhId) : "",
      xaPhuongId: me.xaPhuongId ? String(me.xaPhuongId) : "",
    });
  }, []);

  return {
    provinces,
    wards,
    loadingWards,
    personalInfoForm,
    setPersonalInfoForm,
    handlePersonalInfoFormChange,
    hydratePersonalInfoFromMe,
  };
}

"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import { authService, type UserProfileResponse } from "@/services/auth/auth.service";
import {
  candidateProfileService,
  type CandidateProfile,
  type CandidateProfileListItem,
} from "@/services/candidate/candidate-profile.service";
import type { PersonalInfoFormState } from "../components/PersonalInfoPanel";
import type { LocalUser } from "./types";
import type { SummaryFormState } from "./useCandidateProfileData";

type UseCandidateProfileSummaryActionsParams = {
  activeProfileId: number | null;
  profiles: CandidateProfileListItem[];
  summaryForm: SummaryFormState;
  personalInfoForm: PersonalInfoFormState;
  setProfile: Dispatch<SetStateAction<UserProfileResponse | null>>;
  setProfiles: Dispatch<SetStateAction<CandidateProfileListItem[]>>;
  setActiveProfileId: Dispatch<SetStateAction<number | null>>;
  setCandidateData: Dispatch<SetStateAction<CandidateProfile | null>>;
  setSummaryForm: Dispatch<SetStateAction<SummaryFormState>>;
  setPersonalInfoForm: Dispatch<SetStateAction<PersonalInfoFormState>>;
  setUnsyncedProfileId: Dispatch<SetStateAction<number | null>>;
  markProfileIndexDirty: () => void;
};

export function useCandidateProfileSummaryActions({
  activeProfileId,
  profiles,
  summaryForm,
  personalInfoForm,
  setProfile,
  setProfiles,
  setActiveProfileId,
  setCandidateData,
  setSummaryForm,
  setPersonalInfoForm,
  setUnsyncedProfileId,
  markProfileIndexDirty,
}: UseCandidateProfileSummaryActionsParams) {
  const [savingSummary, setSavingSummary] = useState(false);
  const [savingPersonalInfo, setSavingPersonalInfo] = useState(false);
  const [savingProfileIndex, setSavingProfileIndex] = useState(false);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [settingPrimary, setSettingPrimary] = useState(false);

  const syncPhoneToLocalUser = (soDienThoai: string | null) => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      return;
    }
    const localUser = JSON.parse(raw) as LocalUser;
    localStorage.setItem(
      "user",
      JSON.stringify({
        ...localUser,
        soDienThoai,
      }),
    );
  };

  const handleSaveSummary = async () => {
    if (!activeProfileId) {
      toast.error("Bạn cần chọn hồ sơ trước khi lưu phần giới thiệu.");
      return;
    }
    try {
      setSavingSummary(true);
      const updated = await candidateProfileService.updateSummaryByProfile(activeProfileId, summaryForm);
      setCandidateData((prev) =>
        prev
          ? {
              ...prev,
              tenHoSo: updated.tenHoSo,
              gioiThieuBanThan: updated.gioiThieuBanThan,
              mucTieuNgheNghiep: updated.mucTieuNgheNghiep,
            }
          : prev,
      );
      setProfiles((prev) =>
        prev.map((item) =>
          item.id === activeProfileId
            ? {
                ...item,
                tenHoSo: updated.tenHoSo,
                tieuDe: updated.tenHoSo ?? item.tieuDe,
                gioiThieuBanThan: updated.gioiThieuBanThan,
                mucTieuNgheNghiep: updated.mucTieuNgheNghiep,
              }
            : item,
        ),
      );
      markProfileIndexDirty();
      toast.success("Đã lưu phần giới thiệu.");
    } catch {
      toast.error("Không thể lưu phần giới thiệu.");
    } finally {
      setSavingSummary(false);
    }
  };

  const handleSavePersonalInfo = async () => {
    if (personalInfoForm.tinhThanhId && !personalInfoForm.xaPhuongId) {
      toast.error("Bạn cần chọn xã/phường khi đã chọn tỉnh/thành.");
      return;
    }

    try {
      setSavingPersonalInfo(true);
      const updated = await authService.updateMe({
        soDienThoai: personalInfoForm.soDienThoai.trim(),
        ngaySinh: personalInfoForm.ngaySinh || null,
        gioiTinh: personalInfoForm.gioiTinh || null,
        diaChiChiTiet: personalInfoForm.diaChiChiTiet.trim(),
        xaPhuongId: personalInfoForm.xaPhuongId ? Number(personalInfoForm.xaPhuongId) : null,
      });
      setProfile(updated);
      setPersonalInfoForm({
        soDienThoai: updated.soDienThoai ?? "",
        ngaySinh: updated.ngaySinh ?? "",
        gioiTinh: updated.gioiTinh ?? "",
        diaChiChiTiet: updated.diaChiChiTiet ?? "",
        tinhThanhId: updated.tinhThanhId ? String(updated.tinhThanhId) : "",
        xaPhuongId: updated.xaPhuongId ? String(updated.xaPhuongId) : "",
      });
      syncPhoneToLocalUser(updated.soDienThoai);
      toast.success("Đã cập nhật thông tin cá nhân.");
    } catch {
      toast.error("Không thể cập nhật thông tin cá nhân.");
    } finally {
      setSavingPersonalInfo(false);
    }
  };

  const handleCreateProfile = async () => {
    try {
      setCreatingProfile(true);
      const created = await candidateProfileService.createProfile({
        tenHoSo: `Hồ sơ ${profiles.length + 1}`,
      });
      setProfiles((prev) => [created, ...prev]);
      setActiveProfileId(created.id);
      setUnsyncedProfileId(created.id);
      toast.success("Đã tạo hồ sơ mới.");
    } catch {
      toast.error("Không thể tạo hồ sơ mới.");
    } finally {
      setCreatingProfile(false);
    }
  };

  const handleSetPrimary = async (profileId: number) => {
    try {
      setSettingPrimary(true);
      const updated = await candidateProfileService.setPrimary(profileId);
      setProfiles(updated);
      toast.success("Đã đặt hồ sơ chính.");
    } catch {
      toast.error("Không thể đặt hồ sơ chính.");
    } finally {
      setSettingPrimary(false);
    }
  };

  const handleSaveProfileIndex = async () => {
    if (!activeProfileId) {
      toast.error("Bạn cần chọn hồ sơ trước khi lưu.");
      return;
    }

    try {
      setSavingProfileIndex(true);
      const updated = await candidateProfileService.syncProfileIndex(activeProfileId);
      setCandidateData(updated);
      setUnsyncedProfileId(null);
      toast.success("Đã lưu hồ sơ và cập nhật AI Matching.");
    } catch {
      toast.error("Không thể cập nhật AI Matching cho hồ sơ.");
    } finally {
      setSavingProfileIndex(false);
    }
  };

  return {
    savingSummary,
    savingPersonalInfo,
    savingProfileIndex,
    creatingProfile,
    settingPrimary,
    setSummaryForm,
    handleSaveSummary,
    handleSavePersonalInfo,
    handleCreateProfile,
    handleSaveProfileIndex,
    handleSetPrimary,
  };
}

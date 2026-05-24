"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authService, type UserProfileResponse } from "@/services/auth.service";
import {
  candidateProfileService,
  type CandidateProfile,
  type CandidateProfileListItem,
  type CandidateProfileMetadata,
} from "@/services/candidate-profile.service";
import type { LocalUser } from "./types";

export type SummaryFormState = {
  tenHoSo: string;
  gioiThieuBanThan: string;
  mucTieuNgheNghiep: string;
};

// Nạp dữ liệu hồ sơ ứng viên: me, danh sách hồ sơ, metadata, active profile.
export function useCandidateProfileData(user: LocalUser | null, onLoadedMe?: (me: UserProfileResponse) => void) {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [candidateData, setCandidateData] = useState<CandidateProfile | null>(null);
  const [metadata, setMetadata] = useState<CandidateProfileMetadata | null>(null);
  const [profiles, setProfiles] = useState<CandidateProfileListItem[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null);
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [selectedIndustryIds, setSelectedIndustryIds] = useState<number[]>([]);
  const [summaryForm, setSummaryForm] = useState<SummaryFormState>({
    tenHoSo: "",
    gioiThieuBanThan: "",
    mucTieuNgheNghiep: "",
  });

  useEffect(() => {
    const loadAll = async () => {
      if (!user) {
        return;
      }
      try {
        const [me, profileList, meta] = await Promise.all([
          authService.getMe(),
          candidateProfileService.listProfiles(),
          candidateProfileService.getMetadata(),
        ]);

        const selectedId = profileList[0]?.id ?? null;
        const cp = selectedId ? await candidateProfileService.getProfileById(selectedId) : null;

        setProfile(me);
        setProfiles(profileList);
        setActiveProfileId(selectedId);
        setCandidateData(cp);
        setMetadata(meta);
        setSelectedSkillIds(cp?.kyNangs?.map((item) => item.id) ?? []);
        setSelectedIndustryIds(cp?.nganhNghes?.map((item) => item.id) ?? []);
        setSummaryForm({
          tenHoSo: cp?.tenHoSo ?? "",
          gioiThieuBanThan: cp?.gioiThieuBanThan ?? "",
          mucTieuNgheNghiep: cp?.mucTieuNgheNghiep ?? "",
        });
        onLoadedMe?.(me);
      } catch (error) {
        console.error(error);
        toast.error("Không tải được dữ liệu hồ sơ ứng viên.");
      }
    };

    void loadAll();
  }, [onLoadedMe, user]);

  useEffect(() => {
    const loadActiveProfile = async () => {
      if (!activeProfileId) {
        setCandidateData(null);
        setSelectedSkillIds([]);
        setSelectedIndustryIds([]);
        setSummaryForm({
          tenHoSo: "",
          gioiThieuBanThan: "",
          mucTieuNgheNghiep: "",
        });
        return;
      }

      try {
        const cp = await candidateProfileService.getProfileById(activeProfileId);
        setCandidateData(cp);
        setSelectedSkillIds(cp.kyNangs.map((item) => item.id));
        setSelectedIndustryIds(cp.nganhNghes.map((item) => item.id));
        setSummaryForm({
          tenHoSo: cp.tenHoSo ?? "",
          gioiThieuBanThan: cp.gioiThieuBanThan ?? "",
          mucTieuNgheNghiep: cp.mucTieuNgheNghiep ?? "",
        });
      } catch {
        toast.error("Không tải được hồ sơ đang chọn.");
      }
    };

    void loadActiveProfile();
  }, [activeProfileId]);

  return {
    profile,
    setProfile,
    candidateData,
    setCandidateData,
    metadata,
    profiles,
    setProfiles,
    activeProfileId,
    setActiveProfileId,
    selectedSkillIds,
    setSelectedSkillIds,
    selectedIndustryIds,
    setSelectedIndustryIds,
    summaryForm,
    setSummaryForm,
  };
}

"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import {
  candidateProfileService,
  type CandidateProfile,
  type CandidateWorkExperienceItem,
  type UpsertWorkExperiencePayload,
} from "@/services/candidate/candidate-profile.service";
import type { WorkExperienceFormState } from "../components/modals/profileFormTypes";
import { isDateRangeInvalid } from "./profileActionUtils";

type Params = {
  activeProfileId: number | null;
  setCandidateData: Dispatch<SetStateAction<CandidateProfile | null>>;
  markProfileIndexDirty: () => void;
};

const normalizePayload = (payload: WorkExperienceFormState): UpsertWorkExperiencePayload => ({
  tenCongTy: payload.tenCongTy.trim(),
  chucDanh: payload.chucDanh.trim() || undefined,
  moTaCongViec: payload.moTaCongViec.trim() || undefined,
  thoiGianBatDau: payload.thoiGianBatDau || undefined,
  thoiGianKetThuc: payload.thoiGianKetThuc || undefined,
});

export function useWorkExperienceActions({ activeProfileId, setCandidateData, markProfileIndexDirty }: Params) {
  const [submittingExp, setSubmittingExp] = useState(false);

  const createWorkExperience = async (payload: WorkExperienceFormState): Promise<CandidateWorkExperienceItem | null> => {
    if (!payload.tenCongTy.trim()) {
      toast.error("Tên công ty không được để trống.");
      return null;
    }
    if (isDateRangeInvalid(payload.thoiGianBatDau, payload.thoiGianKetThuc)) {
      toast.error("Thời gian làm việc: từ ngày không được lớn hơn đến ngày.");
      return null;
    }
    try {
      setSubmittingExp(true);
      const body = normalizePayload(payload);
      const created = activeProfileId
        ? await candidateProfileService.createWorkExperienceByProfile(activeProfileId, body)
        : await candidateProfileService.createWorkExperience(body);
      setCandidateData((prev) => (prev ? { ...prev, kinhNghiems: [created, ...prev.kinhNghiems] } : prev));
      markProfileIndexDirty();
      toast.success("Đã thêm kinh nghiệm làm việc.");
      return created;
    } catch {
      toast.error("Không thể thêm kinh nghiệm làm việc.");
      return null;
    } finally {
      setSubmittingExp(false);
    }
  };

  const updateWorkExperience = async (experienceId: number, payload: WorkExperienceFormState): Promise<CandidateWorkExperienceItem | null> => {
    if (!payload.tenCongTy.trim()) {
      toast.error("Tên công ty không được để trống.");
      return null;
    }
    if (isDateRangeInvalid(payload.thoiGianBatDau, payload.thoiGianKetThuc)) {
      toast.error("Thời gian làm việc: từ ngày không được lớn hơn đến ngày.");
      return null;
    }
    try {
      setSubmittingExp(true);
      const body = normalizePayload(payload);
      const updated = activeProfileId
        ? await candidateProfileService.updateWorkExperienceByProfile(activeProfileId, experienceId, body)
        : await candidateProfileService.updateWorkExperience(experienceId, body);
      setCandidateData((prev) =>
        prev ? { ...prev, kinhNghiems: prev.kinhNghiems.map((x) => (x.id === updated.id ? updated : x)) } : prev,
      );
      markProfileIndexDirty();
      toast.success("Đã cập nhật kinh nghiệm làm việc.");
      return updated;
    } catch {
      toast.error("Không thể cập nhật kinh nghiệm làm việc.");
      return null;
    } finally {
      setSubmittingExp(false);
    }
  };

  const handleDeleteWorkExperience = async (item: CandidateWorkExperienceItem) => {
    try {
      if (activeProfileId) {
        await candidateProfileService.deleteWorkExperienceByProfile(activeProfileId, item.id);
      } else {
        await candidateProfileService.deleteWorkExperience(item.id);
      }
      setCandidateData((prev) =>
        prev ? { ...prev, kinhNghiems: prev.kinhNghiems.filter((x) => x.id !== item.id) } : prev,
      );
      markProfileIndexDirty();
      toast.success("Đã xoá kinh nghiệm làm việc.");
    } catch {
      toast.error("Xoá kinh nghiệm làm việc thất bại.");
    }
  };

  const handleToggleWorkExperienceSelection = async (item: CandidateWorkExperienceItem) => {
    if (!activeProfileId) return;
    const nextValue = !item.duocChon;
    try {
      await candidateProfileService.updateExperienceSelectionByProfile(activeProfileId, item.id, nextValue);
      setCandidateData((prev) =>
        prev ? { ...prev, kinhNghiems: prev.kinhNghiems.map((x) => (x.id === item.id ? { ...x, duocChon: nextValue } : x)) } : prev,
      );
      markProfileIndexDirty();
    } catch {
      toast.error("Không thể cập nhật hiển thị kinh nghiệm.");
    }
  };

  return { submittingExp, createWorkExperience, updateWorkExperience, handleDeleteWorkExperience, handleToggleWorkExperienceSelection };
}

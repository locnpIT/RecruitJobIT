"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import {
  candidateProfileService,
  type CandidateEducationItem,
  type CandidateProfile,
  type UpsertEducationPayload,
} from "@/services/candidate/candidate-profile.service";
import type { EducationFormState } from "../components/modals/profileFormTypes";
import { isDateRangeInvalid } from "./profileActionUtils";

type Params = {
  activeProfileId: number | null;
  setCandidateData: Dispatch<SetStateAction<CandidateProfile | null>>;
  markProfileIndexDirty: () => void;
};

const normalizePayload = (payload: EducationFormState): UpsertEducationPayload => ({
  tenTruong: payload.tenTruong.trim(),
  chuyenNganh: payload.chuyenNganh.trim() || undefined,
  bacHoc: payload.bacHoc.trim() || undefined,
  thoiGianBatDau: payload.thoiGianBatDau || undefined,
  thoiGianKetThuc: payload.thoiGianKetThuc || undefined,
  duongDanTep: payload.duongDanTep.trim() || undefined,
});

export function useEducationActions({ activeProfileId, setCandidateData, markProfileIndexDirty }: Params) {
  const [submittingEdu, setSubmittingEdu] = useState(false);

  const createEducation = async (payload: EducationFormState): Promise<CandidateEducationItem | null> => {
    if (!payload.tenTruong.trim()) {
      toast.error("Tên trường không được để trống.");
      return null;
    }
    if (isDateRangeInvalid(payload.thoiGianBatDau, payload.thoiGianKetThuc)) {
      toast.error("Thời gian học: từ ngày không được lớn hơn đến ngày.");
      return null;
    }
    try {
      setSubmittingEdu(true);
      const body = normalizePayload(payload);
      const created = activeProfileId
        ? await candidateProfileService.createEducationByProfile(activeProfileId, body)
        : await candidateProfileService.createEducation(body);
      setCandidateData((prev) => (prev ? { ...prev, hocVans: [created, ...prev.hocVans] } : prev));
      markProfileIndexDirty();
      toast.success("Đã thêm học vấn.");
      return created;
    } catch {
      toast.error("Không thể thêm học vấn.");
      return null;
    } finally {
      setSubmittingEdu(false);
    }
  };

  const updateEducation = async (educationId: number, payload: EducationFormState): Promise<CandidateEducationItem | null> => {
    if (!payload.tenTruong.trim()) {
      toast.error("Tên trường không được để trống.");
      return null;
    }
    if (isDateRangeInvalid(payload.thoiGianBatDau, payload.thoiGianKetThuc)) {
      toast.error("Thời gian học: từ ngày không được lớn hơn đến ngày.");
      return null;
    }
    try {
      setSubmittingEdu(true);
      const updated = await candidateProfileService.updateEducation(educationId, normalizePayload(payload));
      setCandidateData((prev) =>
        prev ? { ...prev, hocVans: prev.hocVans.map((x) => (x.id === updated.id ? updated : x)) } : prev,
      );
      markProfileIndexDirty();
      toast.success("Đã cập nhật học vấn.");
      return updated;
    } catch {
      toast.error("Không thể cập nhật học vấn.");
      return null;
    } finally {
      setSubmittingEdu(false);
    }
  };

  const handleDeleteEducation = async (item: CandidateEducationItem) => {
    try {
      if (activeProfileId) {
        await candidateProfileService.deleteEducationByProfile(activeProfileId, item.id);
      } else {
        await candidateProfileService.deleteEducation(item.id);
      }
      setCandidateData((prev) => (prev ? { ...prev, hocVans: prev.hocVans.filter((x) => x.id !== item.id) } : prev));
      markProfileIndexDirty();
      toast.success("Đã xoá học vấn.");
    } catch {
      toast.error("Xoá học vấn thất bại.");
    }
  };

  const handleToggleEducationSelection = async (item: CandidateEducationItem) => {
    if (!activeProfileId) return;
    const nextValue = !item.duocChon;
    try {
      await candidateProfileService.updateEducationSelectionByProfile(activeProfileId, item.id, nextValue);
      setCandidateData((prev) =>
        prev ? { ...prev, hocVans: prev.hocVans.map((x) => (x.id === item.id ? { ...x, duocChon: nextValue } : x)) } : prev,
      );
      markProfileIndexDirty();
    } catch {
      toast.error("Không thể cập nhật hiển thị học vấn.");
    }
  };

  return { submittingEdu, createEducation, updateEducation, handleDeleteEducation, handleToggleEducationSelection };
}

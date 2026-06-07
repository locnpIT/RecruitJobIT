"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import {
  candidateProfileService,
  type CandidateCertificateItem,
  type CandidateProfile,
  type UpsertCertificatePayload,
} from "@/services/candidate/candidate-profile.service";
import type { CertificateFormState } from "../components/modals/profileFormTypes";
import { isDateRangeInvalid } from "./profileActionUtils";

type Params = {
  activeProfileId: number | null;
  setCandidateData: Dispatch<SetStateAction<CandidateProfile | null>>;
  markProfileIndexDirty: () => void;
};

const normalizePayload = (payload: CertificateFormState): UpsertCertificatePayload => ({
  loaiChungChiId: Number(payload.loaiChungChiId),
  tenChungChi: payload.tenChungChi.trim(),
  ngayBatDau: payload.ngayBatDau || undefined,
  ngayHetHan: payload.ngayHetHan || undefined,
  duongDanTep: payload.duongDanTep.trim() || undefined,
});

export function useCertificateActions({ activeProfileId, setCandidateData, markProfileIndexDirty }: Params) {
  const [submittingCert, setSubmittingCert] = useState(false);

  const createCertificate = async (payload: CertificateFormState): Promise<CandidateCertificateItem | null> => {
    if (!payload.loaiChungChiId || !payload.tenChungChi.trim()) {
      toast.error("Vui lòng nhập loại chứng chỉ và tên chứng chỉ.");
      return null;
    }
    if (isDateRangeInvalid(payload.ngayBatDau, payload.ngayHetHan)) {
      toast.error("Thời hạn chứng chỉ: ngày cấp không được lớn hơn ngày hết hạn.");
      return null;
    }
    try {
      setSubmittingCert(true);
      const body = normalizePayload(payload);
      const created = activeProfileId
        ? await candidateProfileService.createCertificateByProfile(activeProfileId, body)
        : await candidateProfileService.createCertificate(body);
      setCandidateData((prev) => (prev ? { ...prev, chungChis: [created, ...prev.chungChis] } : prev));
      markProfileIndexDirty();
      toast.success("Đã thêm chứng chỉ.");
      return created;
    } catch {
      toast.error("Không thể thêm chứng chỉ.");
      return null;
    } finally {
      setSubmittingCert(false);
    }
  };

  const updateCertificate = async (certificateId: number, payload: CertificateFormState): Promise<CandidateCertificateItem | null> => {
    if (!payload.loaiChungChiId || !payload.tenChungChi.trim()) {
      toast.error("Vui lòng nhập loại chứng chỉ và tên chứng chỉ.");
      return null;
    }
    if (isDateRangeInvalid(payload.ngayBatDau, payload.ngayHetHan)) {
      toast.error("Thời hạn chứng chỉ: ngày cấp không được lớn hơn ngày hết hạn.");
      return null;
    }
    try {
      setSubmittingCert(true);
      const updated = await candidateProfileService.updateCertificate(certificateId, normalizePayload(payload));
      setCandidateData((prev) =>
        prev ? { ...prev, chungChis: prev.chungChis.map((x) => (x.id === updated.id ? updated : x)) } : prev,
      );
      markProfileIndexDirty();
      toast.success("Đã cập nhật chứng chỉ.");
      return updated;
    } catch {
      toast.error("Không thể cập nhật chứng chỉ.");
      return null;
    } finally {
      setSubmittingCert(false);
    }
  };

  const handleDeleteCertificate = async (item: CandidateCertificateItem) => {
    try {
      if (activeProfileId) {
        await candidateProfileService.deleteCertificateByProfile(activeProfileId, item.id);
      } else {
        await candidateProfileService.deleteCertificate(item.id);
      }
      setCandidateData((prev) => (prev ? { ...prev, chungChis: prev.chungChis.filter((x) => x.id !== item.id) } : prev));
      markProfileIndexDirty();
      toast.success("Đã xoá chứng chỉ.");
    } catch {
      toast.error("Xoá chứng chỉ thất bại.");
    }
  };

  const handleToggleCertificateSelection = async (item: CandidateCertificateItem) => {
    if (!activeProfileId) return;
    const nextValue = !item.duocChon;
    try {
      await candidateProfileService.updateCertificateSelectionByProfile(activeProfileId, item.id, nextValue);
      setCandidateData((prev) =>
        prev ? { ...prev, chungChis: prev.chungChis.map((x) => (x.id === item.id ? { ...x, duocChon: nextValue } : x)) } : prev,
      );
      markProfileIndexDirty();
    } catch {
      toast.error("Không thể cập nhật hiển thị chứng chỉ.");
    }
  };

  return { submittingCert, createCertificate, updateCertificate, handleDeleteCertificate, handleToggleCertificateSelection };
}

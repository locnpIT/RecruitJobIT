"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import {
  candidateProfileService,
  type CandidateCertificateItem,
  type CandidateEducationItem,
  type CandidateProfile,
  type CandidateWorkExperienceItem,
  type UpsertCertificatePayload,
  type UpsertEducationPayload,
  type UpsertWorkExperiencePayload,
} from "@/services/candidate-profile.service";
import type {
  CertificateFormState,
  EducationFormState,
  WorkExperienceFormState,
} from "../components/modals/profileFormTypes";
import { isDateRangeInvalid } from "./profileActionUtils";

type UseCandidateProfileContentActionsParams = {
  activeProfileId: number | null;
  setCandidateData: Dispatch<SetStateAction<CandidateProfile | null>>;
  markProfileIndexDirty: () => void;
};

export function useCandidateProfileContentActions({
  activeProfileId,
  setCandidateData,
  markProfileIndexDirty,
}: UseCandidateProfileContentActionsParams) {
  const [submittingEdu, setSubmittingEdu] = useState(false);
  const [submittingExp, setSubmittingExp] = useState(false);
  const [submittingCert, setSubmittingCert] = useState(false);

  const normalizeEducationPayload = (payload: EducationFormState): UpsertEducationPayload => ({
    tenTruong: payload.tenTruong.trim(),
    chuyenNganh: payload.chuyenNganh.trim() || undefined,
    bacHoc: payload.bacHoc.trim() || undefined,
    thoiGianBatDau: payload.thoiGianBatDau || undefined,
    thoiGianKetThuc: payload.thoiGianKetThuc || undefined,
    duongDanTep: payload.duongDanTep.trim() || undefined,
  });

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
      const body = normalizeEducationPayload(payload);
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

  const updateEducation = async (
    educationId: number,
    payload: EducationFormState,
  ): Promise<CandidateEducationItem | null> => {
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
      const updated = await candidateProfileService.updateEducation(educationId, normalizeEducationPayload(payload));
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

  const normalizeCertificatePayload = (payload: CertificateFormState): UpsertCertificatePayload => ({
    loaiChungChiId: Number(payload.loaiChungChiId),
    tenChungChi: payload.tenChungChi.trim(),
    ngayBatDau: payload.ngayBatDau || undefined,
    ngayHetHan: payload.ngayHetHan || undefined,
    duongDanTep: payload.duongDanTep.trim() || undefined,
  });

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
      const body = normalizeCertificatePayload(payload);
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

  const updateCertificate = async (
    certificateId: number,
    payload: CertificateFormState,
  ): Promise<CandidateCertificateItem | null> => {
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
      const updated = await candidateProfileService.updateCertificate(certificateId, normalizeCertificatePayload(payload));
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

  const normalizeWorkExperiencePayload = (payload: WorkExperienceFormState): UpsertWorkExperiencePayload => ({
    tenCongTy: payload.tenCongTy.trim(),
    chucDanh: payload.chucDanh.trim() || undefined,
    moTaCongViec: payload.moTaCongViec.trim() || undefined,
    thoiGianBatDau: payload.thoiGianBatDau || undefined,
    thoiGianKetThuc: payload.thoiGianKetThuc || undefined,
  });

  const createWorkExperience = async (
    payload: WorkExperienceFormState,
  ): Promise<CandidateWorkExperienceItem | null> => {
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
      const body = normalizeWorkExperiencePayload(payload);
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

  const updateWorkExperience = async (
    experienceId: number,
    payload: WorkExperienceFormState,
  ): Promise<CandidateWorkExperienceItem | null> => {
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
      const body = normalizeWorkExperiencePayload(payload);
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

  const handleToggleEducationSelection = async (item: CandidateEducationItem) => {
    if (!activeProfileId) {
      return;
    }
    const nextValue = !item.duocChon;
    try {
      await candidateProfileService.updateEducationSelectionByProfile(activeProfileId, item.id, nextValue);
      setCandidateData((prev) =>
        prev
          ? {
              ...prev,
              hocVans: prev.hocVans.map((x) => (x.id === item.id ? { ...x, duocChon: nextValue } : x)),
            }
          : prev,
      );
      markProfileIndexDirty();
    } catch {
      toast.error("Không thể cập nhật hiển thị học vấn.");
    }
  };

  const handleToggleCertificateSelection = async (item: CandidateCertificateItem) => {
    if (!activeProfileId) {
      return;
    }
    const nextValue = !item.duocChon;
    try {
      await candidateProfileService.updateCertificateSelectionByProfile(activeProfileId, item.id, nextValue);
      setCandidateData((prev) =>
        prev
          ? {
              ...prev,
              chungChis: prev.chungChis.map((x) => (x.id === item.id ? { ...x, duocChon: nextValue } : x)),
            }
          : prev,
      );
      markProfileIndexDirty();
    } catch {
      toast.error("Không thể cập nhật hiển thị chứng chỉ.");
    }
  };

  const handleToggleWorkExperienceSelection = async (item: CandidateWorkExperienceItem) => {
    if (!activeProfileId) {
      return;
    }
    const nextValue = !item.duocChon;
    try {
      await candidateProfileService.updateExperienceSelectionByProfile(activeProfileId, item.id, nextValue);
      setCandidateData((prev) =>
        prev
          ? {
              ...prev,
              kinhNghiems: prev.kinhNghiems.map((x) => (x.id === item.id ? { ...x, duocChon: nextValue } : x)),
            }
          : prev,
      );
      markProfileIndexDirty();
    } catch {
      toast.error("Không thể cập nhật hiển thị kinh nghiệm.");
    }
  };

  return {
    submittingEdu,
    submittingExp,
    submittingCert,
    createEducation,
    updateEducation,
    handleDeleteEducation,
    createCertificate,
    updateCertificate,
    handleDeleteCertificate,
    createWorkExperience,
    updateWorkExperience,
    handleDeleteWorkExperience,
    handleToggleEducationSelection,
    handleToggleCertificateSelection,
    handleToggleWorkExperienceSelection,
  };
}

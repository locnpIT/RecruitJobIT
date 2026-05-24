"use client";

import { useState, type ChangeEvent, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import { authService, type UserProfileResponse } from "@/services/auth.service";
import {
  candidateProfileService,
  type UpsertCertificatePayload,
  type UpsertEducationPayload,
  type UpsertWorkExperiencePayload,
  type CandidateCertificateItem,
  type CandidateEducationItem,
  type CandidateProfile,
  type CandidateProfileListItem,
  type CandidateWorkExperienceItem,
} from "@/services/candidate-profile.service";
import type { PersonalInfoFormState } from "../components/PersonalInfoPanel";
import type { LocalUser } from "./types";
import type { SummaryFormState } from "./useCandidateProfileData";

type EducationFormState = {
  tenTruong: string;
  chuyenNganh: string;
  bacHoc: string;
  thoiGianBatDau: string;
  thoiGianKetThuc: string;
  duongDanTep: string;
};

type CertificateFormState = {
  loaiChungChiId: string;
  tenChungChi: string;
  ngayBatDau: string;
  ngayHetHan: string;
  duongDanTep: string;
};

type WorkExperienceFormState = {
  tenCongTy: string;
  chucDanh: string;
  moTaCongViec: string;
  thoiGianBatDau: string;
  thoiGianKetThuc: string;
};

const isDateRangeInvalid = (from?: string, to?: string) => {
  if (!from || !to) {
    return false;
  }
  // Inputs come from <input type="date"> => YYYY-MM-DD, safe to compare lexicographically.
  return from > to;
};

type UseCandidateProfileActionsParams = {
  activeProfileId: number | null;
  selectedSkillIds: number[];
  selectedIndustryIds: number[];
  summaryForm: SummaryFormState;
  personalInfoForm: PersonalInfoFormState;
  setProfile: Dispatch<SetStateAction<UserProfileResponse | null>>;
  profiles: CandidateProfileListItem[];
  setProfiles: Dispatch<SetStateAction<CandidateProfileListItem[]>>;
  setActiveProfileId: Dispatch<SetStateAction<number | null>>;
  setCandidateData: Dispatch<SetStateAction<CandidateProfile | null>>;
  setSelectedSkillIds: Dispatch<SetStateAction<number[]>>;
  setSelectedIndustryIds: Dispatch<SetStateAction<number[]>>;
  setSummaryForm: Dispatch<SetStateAction<SummaryFormState>>;
  setPersonalInfoForm: Dispatch<SetStateAction<PersonalInfoFormState>>;
};

// Dùng cho màn profile: gom toàn bộ mutation/action để page chỉ còn orchestration + layout.
export function useCandidateProfileActions({
  activeProfileId,
  selectedSkillIds,
  selectedIndustryIds,
  summaryForm,
  personalInfoForm,
  setProfile,
  profiles,
  setProfiles,
  setActiveProfileId,
  setCandidateData,
  setSelectedSkillIds,
  setSelectedIndustryIds,
  setSummaryForm,
  setPersonalInfoForm,
}: UseCandidateProfileActionsParams) {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingEduProof, setUploadingEduProof] = useState(false);
  const [uploadingCertProof, setUploadingCertProof] = useState(false);
  const [submittingEdu, setSubmittingEdu] = useState(false);
  const [submittingExp, setSubmittingExp] = useState(false);
  const [submittingCert, setSubmittingCert] = useState(false);
  const [savingSkills, setSavingSkills] = useState(false);
  const [savingIndustries, setSavingIndustries] = useState(false);
  const [savingSummary, setSavingSummary] = useState(false);
  const [savingPersonalInfo, setSavingPersonalInfo] = useState(false);
  const [savingProfileIndex, setSavingProfileIndex] = useState(false);
  const [unsyncedProfileId, setUnsyncedProfileId] = useState<number | null>(null);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const hasUnsyncedProfileChanges = activeProfileId != null && unsyncedProfileId === activeProfileId;

  const markProfileIndexDirty = () => {
    if (activeProfileId != null) {
      setUnsyncedProfileId(activeProfileId);
    }
  };

  const syncAvatarToLocalUser = (anhDaiDienUrl: string | null) => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      return;
    }
    const localUser = JSON.parse(raw) as LocalUser;
    localStorage.setItem("user", JSON.stringify({ ...localUser, anhDaiDienUrl }));
  };

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

  const handleSelectAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh.");
      return;
    }

    try {
      setUploadingAvatar(true);
      const signature = await authService.getCloudinarySignature("avatar");
      const uploadedUrl = await authService.uploadToCloudinary(file, signature);
      const updated = await authService.updateAvatar(uploadedUrl);
      setProfile(updated);
      syncAvatarToLocalUser(updated.anhDaiDienUrl);
      toast.success("Cập nhật ảnh đại diện thành công.");
    } catch {
      toast.error("Không thể cập nhật ảnh đại diện.");
    } finally {
      setUploadingAvatar(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const uploadProofToCloudinary = async (file: File) => {
    const signature = await authService.getCloudinarySignature("proof");
    return authService.uploadToCloudinary(file, signature);
  };

  const uploadEducationProof = async (file: File) => {
    try {
      setUploadingEduProof(true);
      const uploadedUrl = await uploadProofToCloudinary(file);
      toast.success("Đã tải minh chứng học vấn.");
      return uploadedUrl;
    } catch {
      toast.error("Không thể tải minh chứng học vấn.");
      return "";
    } finally {
      setUploadingEduProof(false);
    }
  };

  const uploadCertificateProof = async (file: File) => {
    try {
      setUploadingCertProof(true);
      const uploadedUrl = await uploadProofToCloudinary(file);
      toast.success("Đã tải minh chứng chứng chỉ.");
      return uploadedUrl;
    } catch {
      toast.error("Không thể tải minh chứng chứng chỉ.");
      return "";
    } finally {
      setUploadingCertProof(false);
    }
  };

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

  const toggleSkill = (skillId: number) => {
    setSelectedSkillIds((prev) => (prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]));
  };

  const handleSaveSkills = async (nextSkillIds = selectedSkillIds) => {
    try {
      setSavingSkills(true);
      const updated = activeProfileId
        ? await candidateProfileService.updateSkillsByProfile(activeProfileId, nextSkillIds)
        : await candidateProfileService.updateSkills(nextSkillIds);
      setSelectedSkillIds(updated.map((item) => item.id));
      setCandidateData((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          kyNangs: updated.map((item) => ({ ...item, duocChon: true })),
        };
      });
      markProfileIndexDirty();
      toast.success("Đã cập nhật kỹ năng.");
      return true;
    } catch {
      toast.error("Không thể cập nhật kỹ năng.");
      return false;
    } finally {
      setSavingSkills(false);
    }
  };

  const toggleIndustry = (industryId: number) => {
    setSelectedIndustryIds((prev) =>
      prev.includes(industryId) ? prev.filter((id) => id !== industryId) : [...prev, industryId],
    );
  };

  const handleSaveIndustries = async (nextIndustryIds = selectedIndustryIds) => {
    try {
      setSavingIndustries(true);
      const updated = activeProfileId
        ? await candidateProfileService.updateIndustriesByProfile(activeProfileId, nextIndustryIds)
        : await candidateProfileService.updateIndustries(nextIndustryIds);
      setSelectedIndustryIds(updated.map((item) => item.id));
      setCandidateData((prev) => (prev ? { ...prev, nganhNghes: updated } : prev));
      markProfileIndexDirty();
      toast.success("Đã cập nhật ngành nghề quan tâm.");
      return true;
    } catch {
      toast.error("Không thể cập nhật ngành nghề.");
      return false;
    } finally {
      setSavingIndustries(false);
    }
  };

  const handleSaveSummary = async () => {
    try {
      setSavingSummary(true);
      const updated = activeProfileId
        ? await candidateProfileService.updateSummaryByProfile(activeProfileId, summaryForm)
        : await candidateProfileService.updateSummary(summaryForm);
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
    uploadingAvatar,
    uploadingEduProof,
    uploadingCertProof,
    submittingEdu,
    submittingExp,
    submittingCert,
    savingSkills,
    savingIndustries,
    savingSummary,
    savingPersonalInfo,
    savingProfileIndex,
    hasUnsyncedProfileChanges,
    creatingProfile,
    setSummaryForm,
    handleSelectAvatar,
    uploadEducationProof,
    uploadCertificateProof,
    createEducation,
    updateEducation,
    handleDeleteEducation,
    createCertificate,
    updateCertificate,
    handleDeleteCertificate,
    createWorkExperience,
    updateWorkExperience,
    handleDeleteWorkExperience,
    toggleSkill,
    handleSaveSkills,
    toggleIndustry,
    handleSaveIndustries,
    handleSaveSummary,
    handleSavePersonalInfo,
    handleSaveProfileIndex,
    handleCreateProfile,
    handleToggleEducationSelection,
    handleToggleCertificateSelection,
    handleToggleWorkExperienceSelection,
  };
}

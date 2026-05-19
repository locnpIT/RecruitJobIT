"use client";

import { useState, type ChangeEvent, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import { authService, type UserProfileResponse } from "@/services/auth.service";
import {
  candidateProfileService,
  type CandidateCertificateItem,
  type CandidateEducationItem,
  type CandidateProfile,
  type CandidateProfileListItem,
  type CandidateWorkExperienceItem,
} from "@/services/candidate-profile.service";
import type { PersonalInfoFormState } from "../components/PersonalInfoPanel";
import type { LocalUser } from "./types";
import type { SummaryFormState } from "./useCandidateProfileData";

const EMPTY_EDU = {
  tenTruong: "",
  chuyenNganh: "",
  bacHoc: "",
  thoiGianBatDau: "",
  thoiGianKetThuc: "",
  duongDanTep: "",
};

const EMPTY_CERT = {
  loaiChungChiId: "",
  tenChungChi: "",
  ngayBatDau: "",
  ngayHetHan: "",
  duongDanTep: "",
};

const EMPTY_EXP = {
  tenCongTy: "",
  chucDanh: "",
  moTaCongViec: "",
  thoiGianBatDau: "",
  thoiGianKetThuc: "",
};

type UseCandidateProfileActionsParams = {
  activeProfileId: number | null;
  selectedSkillIds: number[];
  selectedIndustryIds: number[];
  summaryForm: SummaryFormState;
  personalInfoForm: PersonalInfoFormState;
  setProfile: Dispatch<SetStateAction<UserProfileResponse | null>>;
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

  const [eduForm, setEduForm] = useState(EMPTY_EDU);
  const [certForm, setCertForm] = useState(EMPTY_CERT);
  const [expForm, setExpForm] = useState(EMPTY_EXP);

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

  const handleUploadEducationProof = async (file: File) => {
    try {
      setUploadingEduProof(true);
      const uploadedUrl = await uploadProofToCloudinary(file);
      setEduForm((prev) => ({ ...prev, duongDanTep: uploadedUrl }));
      toast.success("Đã tải minh chứng học vấn.");
    } catch {
      toast.error("Không thể tải minh chứng học vấn.");
    } finally {
      setUploadingEduProof(false);
    }
  };

  const handleUploadCertificateProof = async (file: File) => {
    try {
      setUploadingCertProof(true);
      const uploadedUrl = await uploadProofToCloudinary(file);
      setCertForm((prev) => ({ ...prev, duongDanTep: uploadedUrl }));
      toast.success("Đã tải minh chứng chứng chỉ.");
    } catch {
      toast.error("Không thể tải minh chứng chứng chỉ.");
    } finally {
      setUploadingCertProof(false);
    }
  };

  const handleCreateEducation = async () => {
    if (!eduForm.tenTruong.trim()) {
      toast.error("Tên trường không được để trống.");
      return;
    }

    try {
      setSubmittingEdu(true);
      const created = activeProfileId
        ? await candidateProfileService.createEducationByProfile(activeProfileId, {
            tenTruong: eduForm.tenTruong.trim(),
            chuyenNganh: eduForm.chuyenNganh.trim() || undefined,
            bacHoc: eduForm.bacHoc.trim() || undefined,
            thoiGianBatDau: eduForm.thoiGianBatDau || undefined,
            thoiGianKetThuc: eduForm.thoiGianKetThuc || undefined,
            duongDanTep: eduForm.duongDanTep.trim() || undefined,
          })
        : await candidateProfileService.createEducation({
            tenTruong: eduForm.tenTruong.trim(),
            chuyenNganh: eduForm.chuyenNganh.trim() || undefined,
            bacHoc: eduForm.bacHoc.trim() || undefined,
            thoiGianBatDau: eduForm.thoiGianBatDau || undefined,
            thoiGianKetThuc: eduForm.thoiGianKetThuc || undefined,
            duongDanTep: eduForm.duongDanTep.trim() || undefined,
          });
      setCandidateData((prev) => (prev ? { ...prev, hocVans: [created, ...prev.hocVans] } : prev));
      setEduForm(EMPTY_EDU);
      toast.success("Đã thêm học vấn.");
    } catch {
      toast.error("Không thể thêm học vấn.");
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
      toast.success("Đã xoá học vấn.");
    } catch {
      toast.error("Xoá học vấn thất bại.");
    }
  };

  const handleCreateCertificate = async () => {
    if (!certForm.loaiChungChiId || !certForm.tenChungChi.trim()) {
      toast.error("Vui lòng nhập loại chứng chỉ và tên chứng chỉ.");
      return;
    }

    try {
      setSubmittingCert(true);
      const created = activeProfileId
        ? await candidateProfileService.createCertificateByProfile(activeProfileId, {
            loaiChungChiId: Number(certForm.loaiChungChiId),
            tenChungChi: certForm.tenChungChi.trim(),
            ngayBatDau: certForm.ngayBatDau || undefined,
            ngayHetHan: certForm.ngayHetHan || undefined,
            duongDanTep: certForm.duongDanTep.trim() || undefined,
          })
        : await candidateProfileService.createCertificate({
            loaiChungChiId: Number(certForm.loaiChungChiId),
            tenChungChi: certForm.tenChungChi.trim(),
            ngayBatDau: certForm.ngayBatDau || undefined,
            ngayHetHan: certForm.ngayHetHan || undefined,
            duongDanTep: certForm.duongDanTep.trim() || undefined,
          });
      setCandidateData((prev) => (prev ? { ...prev, chungChis: [created, ...prev.chungChis] } : prev));
      setCertForm(EMPTY_CERT);
      toast.success("Đã thêm chứng chỉ.");
    } catch {
      toast.error("Không thể thêm chứng chỉ.");
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
      toast.success("Đã xoá chứng chỉ.");
    } catch {
      toast.error("Xoá chứng chỉ thất bại.");
    }
  };

  const handleCreateWorkExperience = async () => {
    if (!expForm.tenCongTy.trim()) {
      toast.error("Tên công ty không được để trống.");
      return;
    }

    try {
      setSubmittingExp(true);
      const created = activeProfileId
        ? await candidateProfileService.createWorkExperienceByProfile(activeProfileId, {
            tenCongTy: expForm.tenCongTy.trim(),
            chucDanh: expForm.chucDanh.trim() || undefined,
            moTaCongViec: expForm.moTaCongViec.trim() || undefined,
            thoiGianBatDau: expForm.thoiGianBatDau || undefined,
            thoiGianKetThuc: expForm.thoiGianKetThuc || undefined,
          })
        : await candidateProfileService.createWorkExperience({
            tenCongTy: expForm.tenCongTy.trim(),
            chucDanh: expForm.chucDanh.trim() || undefined,
            moTaCongViec: expForm.moTaCongViec.trim() || undefined,
            thoiGianBatDau: expForm.thoiGianBatDau || undefined,
            thoiGianKetThuc: expForm.thoiGianKetThuc || undefined,
          });
      setCandidateData((prev) => (prev ? { ...prev, kinhNghiems: [created, ...prev.kinhNghiems] } : prev));
      setExpForm(EMPTY_EXP);
      toast.success("Đã thêm kinh nghiệm làm việc.");
    } catch {
      toast.error("Không thể thêm kinh nghiệm làm việc.");
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
      toast.success("Đã xoá kinh nghiệm làm việc.");
    } catch {
      toast.error("Xoá kinh nghiệm làm việc thất bại.");
    }
  };

  const toggleSkill = (skillId: number) => {
    setSelectedSkillIds((prev) => (prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]));
  };

  const handleSaveSkills = async () => {
    try {
      setSavingSkills(true);
      const updated = activeProfileId
        ? await candidateProfileService.updateSkillsByProfile(activeProfileId, selectedSkillIds)
        : await candidateProfileService.updateSkills(selectedSkillIds);
      setCandidateData((prev) => (prev ? { ...prev, kyNangs: updated } : prev));
      toast.success("Đã cập nhật kỹ năng.");
    } catch {
      toast.error("Không thể cập nhật kỹ năng.");
    } finally {
      setSavingSkills(false);
    }
  };

  const toggleIndustry = (industryId: number) => {
    setSelectedIndustryIds((prev) =>
      prev.includes(industryId) ? prev.filter((id) => id !== industryId) : [...prev, industryId],
    );
  };

  const handleSaveIndustries = async () => {
    try {
      setSavingIndustries(true);
      const updated = activeProfileId
        ? await candidateProfileService.updateIndustriesByProfile(activeProfileId, selectedIndustryIds)
        : await candidateProfileService.updateIndustries(selectedIndustryIds);
      setCandidateData((prev) => (prev ? { ...prev, nganhNghes: updated } : prev));
      toast.success("Đã cập nhật ngành nghề quan tâm.");
    } catch {
      toast.error("Không thể cập nhật ngành nghề.");
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
              gioiThieuBanThan: updated.gioiThieuBanThan,
              mucTieuNgheNghiep: updated.mucTieuNgheNghiep,
            }
          : prev,
      );
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
      const created = await candidateProfileService.createProfile({});
      setProfiles((prev) => [created, ...prev]);
      setActiveProfileId(created.id);
      toast.success("Đã tạo hồ sơ mới.");
    } catch {
      toast.error("Không thể tạo hồ sơ mới.");
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
    eduForm,
    certForm,
    expForm,
    setEduForm,
    setCertForm,
    setExpForm,
    setSummaryForm,
    handleSelectAvatar,
    handleUploadEducationProof,
    handleUploadCertificateProof,
    handleCreateEducation,
    handleDeleteEducation,
    handleCreateCertificate,
    handleDeleteCertificate,
    handleCreateWorkExperience,
    handleDeleteWorkExperience,
    toggleSkill,
    handleSaveSkills,
    toggleIndustry,
    handleSaveIndustries,
    handleSaveSummary,
    handleSavePersonalInfo,
    handleCreateProfile,
  };
}

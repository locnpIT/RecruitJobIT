"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HomeHeader } from "../components/home/HomeHeader";
import { HomeFooter } from "../components/home/HomeFooter";
import { AvatarCard } from "./components/AvatarCard";
import { ProfileInfoGrid } from "./components/ProfileInfoGrid";
import { SkillsPanel } from "./components/SkillsPanel";
import { EducationPanel } from "./components/EducationPanel";
import { CertificatePanel } from "./components/CertificatePanel";
import { SummaryPanel } from "./components/SummaryPanel";
import { ProfileHero } from "./components/ProfileHero";
import { authService, type UserProfileResponse } from "@/services/auth.service";
import {
  candidateProfileService,
  type CandidateCertificateItem,
  type CandidateEducationItem,
  type CandidateProfile,
  type CandidateProfileListItem,
  type CandidateProfileMetadata,
} from "@/services/candidate-profile.service";

// Trang profile ứng viên.
// File này giữ state tổng cho toàn bộ hồ sơ: nhiều profile, kỹ năng, học vấn, chứng chỉ, avatar và summary.
type LocalUser = {
  id: number;
  email: string;
  ten: string | null;
  ho: string | null;
  soDienThoai?: string | null;
  vaiTro: string;
  dangHoatDong: boolean;
  anhDaiDienUrl?: string | null;
};

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

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [candidateData, setCandidateData] = useState<CandidateProfile | null>(null);
  const [metadata, setMetadata] = useState<CandidateProfileMetadata | null>(null);
  const [profiles, setProfiles] = useState<CandidateProfileListItem[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingEduProof, setUploadingEduProof] = useState(false);
  const [uploadingCertProof, setUploadingCertProof] = useState(false);
  const [submittingEdu, setSubmittingEdu] = useState(false);
  const [submittingCert, setSubmittingCert] = useState(false);
  const [savingSkills, setSavingSkills] = useState(false);
  const [savingSummary, setSavingSummary] = useState(false);

  const [eduForm, setEduForm] = useState(EMPTY_EDU);
  const [certForm, setCertForm] = useState(EMPTY_CERT);
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [summaryForm, setSummaryForm] = useState({
    gioiThieuBanThan: "",
    mucTieuNgheNghiep: "",
  });

  const user = useMemo<LocalUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      return JSON.parse(raw) as LocalUser;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    if (user.vaiTro?.toUpperCase() !== "CANDIDATE") {
      router.replace("/");
    }
  }, [router, user]);

  useEffect(() => {
    const loadAll = async () => {
      if (!user) return;
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
        setSummaryForm({
          gioiThieuBanThan: cp?.gioiThieuBanThan ?? "",
          mucTieuNgheNghiep: cp?.mucTieuNgheNghiep ?? "",
        });
      } catch (error) {
        console.error(error);
        toast.error("Không tải được dữ liệu hồ sơ ứng viên.");
      }
    };

    void loadAll();
  }, [user]);

  useEffect(() => {
    const loadActiveProfile = async () => {
      if (!activeProfileId) return;
      try {
        const cp = await candidateProfileService.getProfileById(activeProfileId);
        setCandidateData(cp);
        setSelectedSkillIds(cp.kyNangs.map((item) => item.id));
        setSummaryForm({
          gioiThieuBanThan: cp.gioiThieuBanThan ?? "",
          mucTieuNgheNghiep: cp.mucTieuNgheNghiep ?? "",
        });
      } catch {
        toast.error("Không tải được hồ sơ đang chọn.");
      }
    };
    void loadActiveProfile();
  }, [activeProfileId]);

  const fullName = useMemo(() => {
    const ho = profile?.ho ?? user?.ho ?? "";
    const ten = profile?.ten ?? user?.ten ?? "";
    return `${ho} ${ten}`.trim() || "Chưa cập nhật";
  }, [profile, user]);

  const avatarUrl = profile?.anhDaiDienUrl ?? user?.anhDaiDienUrl ?? null;
  const roleText = profile?.vaiTro ?? user?.vaiTro ?? "";
  const emailText = profile?.email ?? user?.email ?? "";
  const activeText = profile?.dangHoatDong ?? user?.dangHoatDong ?? false;

  const handleSelectAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

      const raw = localStorage.getItem("user");
      if (raw) {
        const localUser = JSON.parse(raw) as LocalUser;
        localStorage.setItem("user", JSON.stringify({ ...localUser, anhDaiDienUrl: updated.anhDaiDienUrl }));
      }
      toast.success("Cập nhật ảnh đại diện thành công.");
    } catch {
      toast.error("Không thể cập nhật ảnh đại diện.");
    } finally {
      setUploadingAvatar(false);
      if (event.target) event.target.value = "";
    }
  };

  const handleCreateEducation = async () => {
    if (!eduForm.tenTruong.trim()) {
      toast.error("Tên trường không được để trống.");
      return;
    }

    try {
      setSubmittingEdu(true);
      const finalCreated = activeProfileId
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
      setCandidateData((prev) => (prev ? { ...prev, hocVans: [finalCreated, ...prev.hocVans] } : prev));
      setEduForm(EMPTY_EDU);
      toast.success("Đã thêm học vấn.");
    } catch {
      toast.error("Không thể thêm học vấn.");
    } finally {
      setSubmittingEdu(false);
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

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <HomeHeader />
        <main className="mx-auto flex min-h-[60vh] w-full max-w-6xl items-center justify-center px-4">
          <p className="text-sm text-slate-600">Đang tải hồ sơ...</p>
        </main>
        <HomeFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <HomeHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <ProfileHero
          profiles={profiles}
          activeProfileId={activeProfileId}
          onChangeProfile={setActiveProfileId}
          onCreateProfile={async () => {
            try {
              const created = await candidateProfileService.createProfile({});
              setProfiles((prev) => [created, ...prev]);
              setActiveProfileId(created.id);
              toast.success("Đã tạo hồ sơ mới.");
            } catch {
              toast.error("Không thể tạo hồ sơ mới.");
            }
          }}
        />
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Candidate profile</p>
          </div>

          <div className="grid gap-5 p-6">
            <section className="space-y-4 rounded-md border border-slate-200 bg-slate-50 p-4">
              <AvatarCard
                avatarUrl={avatarUrl}
                fullName={fullName}
                email={emailText}
                uploading={uploadingAvatar}
                fileInputRef={fileInputRef}
                onSelectAvatar={(e) => void handleSelectAvatar(e)}
              />
              <ProfileInfoGrid
                fullName={fullName}
                email={emailText}
                role={roleText}
                status={activeText ? "Đang hoạt động" : "Đang bị khóa"}
              />
            </section>
          </div>
        </section>

        <section className="mt-6">
          <SummaryPanel
            gioiThieuBanThan={summaryForm.gioiThieuBanThan}
            mucTieuNgheNghiep={summaryForm.mucTieuNgheNghiep}
            saving={savingSummary}
            onChange={setSummaryForm}
            onSave={() => void handleSaveSummary()}
          />
        </section>

        <section className="mt-6">
          <SkillsPanel
            metadata={metadata}
            selectedSkillIds={selectedSkillIds}
            saving={savingSkills}
            onToggleSkill={toggleSkill}
            onSave={() => void handleSaveSkills()}
          />
        </section>

        <section className="mt-6 grid gap-6">
          <EducationPanel
            form={eduForm}
            submitting={submittingEdu}
            uploadingProof={uploadingEduProof}
            items={candidateData?.hocVans ?? []}
            onChange={setEduForm}
            onCreate={() => void handleCreateEducation()}
            onDelete={(item) => void handleDeleteEducation(item)}
            onUploadProof={handleUploadEducationProof}
          />
          <CertificatePanel
            form={certForm}
            metadata={metadata}
            submitting={submittingCert}
            uploadingProof={uploadingCertProof}
            items={candidateData?.chungChis ?? []}
            onChange={setCertForm}
            onCreate={() => void handleCreateCertificate()}
            onDelete={(item) => void handleDeleteCertificate(item)}
            onUploadProof={handleUploadCertificateProof}
          />
        </section>
      </main>
      <HomeFooter />
    </div>
  );
}

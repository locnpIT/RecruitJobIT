"use client";

import { useMemo, useRef } from "react";
import { HomeHeader } from "../components/home/HomeHeader";
import { HomeFooter } from "../components/home/HomeFooter";
import { AvatarCard } from "./components/AvatarCard";
import { ProfileInfoGrid } from "./components/ProfileInfoGrid";
import { SkillsPanel } from "./components/SkillsPanel";
import { IndustriesPanel } from "./components/IndustriesPanel";
import { EducationPanel } from "./components/EducationPanel";
import { WorkExperiencePanel } from "./components/WorkExperiencePanel";
import { CertificatePanel } from "./components/CertificatePanel";
import { SummaryPanel } from "./components/SummaryPanel";
import { ProfileHero } from "./components/ProfileHero";
import { PersonalInfoPanel } from "./components/PersonalInfoPanel";
import { ProfileLoadingState } from "./components/ProfileLoadingState";
import { useCandidateProfileData } from "./hooks/useCandidateProfileData";
import { useCandidateProfileSession } from "./hooks/useCandidateProfileSession";
import { useProfileLocationForm } from "./hooks/useProfileLocationForm";
import { useCandidateProfileActions } from "./hooks/useCandidateProfileActions";

// Trang profile ứng viên: page giữ vai trò orchestration + layout,
// toàn bộ state dữ liệu/mutation đã tách xuống hooks.
export default function ProfilePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useCandidateProfileSession();
  const {
    provinces,
    wards,
    loadingWards,
    personalInfoForm,
    setPersonalInfoForm,
    handlePersonalInfoFormChange,
    hydratePersonalInfoFromMe,
  } = useProfileLocationForm();
  const {
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
  } = useCandidateProfileData(user, hydratePersonalInfoFromMe);

  const actions = useCandidateProfileActions({
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
  });

  const fullName = useMemo(() => {
    const ho = profile?.ho ?? user?.ho ?? "";
    const ten = profile?.ten ?? user?.ten ?? "";
    return `${ho} ${ten}`.trim() || "Chưa cập nhật";
  }, [profile, user]);

  const avatarUrl = profile?.anhDaiDienUrl ?? user?.anhDaiDienUrl ?? null;
  const roleText = profile?.vaiTro ?? user?.vaiTro ?? "";
  const emailText = profile?.email ?? user?.email ?? "";
  const activeText = profile?.dangHoatDong ?? user?.dangHoatDong ?? false;

  if (!user) {
    return <ProfileLoadingState />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <HomeHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <ProfileHero
          profiles={profiles}
          activeProfileId={activeProfileId}
          onChangeProfile={setActiveProfileId}
          onCreateProfile={() => void actions.handleCreateProfile()}
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
                uploading={actions.uploadingAvatar}
                fileInputRef={fileInputRef}
                onSelectAvatar={(event) => void actions.handleSelectAvatar(event)}
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
          <PersonalInfoPanel
            form={personalInfoForm}
            provinces={provinces}
            wards={wards}
            loadingWards={loadingWards}
            saving={actions.savingPersonalInfo}
            onChange={handlePersonalInfoFormChange}
            onSave={() => void actions.handleSavePersonalInfo()}
          />
        </section>

        <section className="mt-6">
          <SummaryPanel
            gioiThieuBanThan={summaryForm.gioiThieuBanThan}
            mucTieuNgheNghiep={summaryForm.mucTieuNgheNghiep}
            saving={actions.savingSummary}
            onChange={actions.setSummaryForm}
            onSave={() => void actions.handleSaveSummary()}
          />
        </section>

        <section className="mt-6">
          <SkillsPanel
            metadata={metadata}
            selectedSkillIds={selectedSkillIds}
            saving={actions.savingSkills}
            onToggleSkill={actions.toggleSkill}
            onSave={() => void actions.handleSaveSkills()}
          />
        </section>

        <section className="mt-6">
          <IndustriesPanel
            metadata={metadata}
            selectedIndustryIds={selectedIndustryIds}
            saving={actions.savingIndustries}
            onToggleIndustry={actions.toggleIndustry}
            onSave={() => void actions.handleSaveIndustries()}
          />
        </section>

        <section className="mt-6 grid gap-6">
          <EducationPanel
            form={actions.eduForm}
            submitting={actions.submittingEdu}
            uploadingProof={actions.uploadingEduProof}
            items={candidateData?.hocVans ?? []}
            onChange={actions.setEduForm}
            onCreate={() => void actions.handleCreateEducation()}
            onDelete={(item) => void actions.handleDeleteEducation(item)}
            onUploadProof={actions.handleUploadEducationProof}
          />
          <WorkExperiencePanel
            form={actions.expForm}
            submitting={actions.submittingExp}
            items={candidateData?.kinhNghiems ?? []}
            onChange={actions.setExpForm}
            onCreate={() => void actions.handleCreateWorkExperience()}
            onDelete={(item) => void actions.handleDeleteWorkExperience(item)}
          />
          <CertificatePanel
            form={actions.certForm}
            metadata={metadata}
            submitting={actions.submittingCert}
            uploadingProof={actions.uploadingCertProof}
            items={candidateData?.chungChis ?? []}
            onChange={actions.setCertForm}
            onCreate={() => void actions.handleCreateCertificate()}
            onDelete={(item) => void actions.handleDeleteCertificate(item)}
            onUploadProof={actions.handleUploadCertificateProof}
          />
        </section>
      </main>
      <HomeFooter />
    </div>
  );
}

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
import { ProfileActionButton } from "./components/ProfileActionButton";
import { PersonalInfoPanel } from "./components/PersonalInfoPanel";
import { ProfileLoadingState } from "./components/ProfileLoadingState";
import { ProfileEmptyState } from "./components/ProfileEmptyState";
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
    profiles,
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
          creatingProfile={actions.creatingProfile}
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

        {!activeProfileId ? (
          <ProfileEmptyState
            creating={actions.creatingProfile}
            onCreateProfile={() => void actions.handleCreateProfile()}
          />
        ) : (
          <>
            <section className="mt-6">
              <SummaryPanel
                tenHoSo={summaryForm.tenHoSo}
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
                onSave={actions.handleSaveSkills}
              />
            </section>

            <section className="mt-6">
              <IndustriesPanel
                metadata={metadata}
                selectedIndustryIds={selectedIndustryIds}
                saving={actions.savingIndustries}
                onSave={actions.handleSaveIndustries}
              />
            </section>

            <section className="mt-6 grid gap-6">
              <EducationPanel
                submitting={actions.submittingEdu}
                uploadingProof={actions.uploadingEduProof}
                items={candidateData?.hocVans ?? []}
                onCreate={actions.createEducation}
                onUpdate={actions.updateEducation}
                onDelete={(item) => void actions.handleDeleteEducation(item)}
                onToggleSelection={(item) => void actions.handleToggleEducationSelection(item)}
                onUploadProof={actions.uploadEducationProof}
              />
              <WorkExperiencePanel
                submitting={actions.submittingExp}
                items={candidateData?.kinhNghiems ?? []}
                onCreate={actions.createWorkExperience}
                onUpdate={actions.updateWorkExperience}
                onDelete={(item) => void actions.handleDeleteWorkExperience(item)}
                onToggleSelection={(item) => void actions.handleToggleWorkExperienceSelection(item)}
              />
              <CertificatePanel
                metadata={metadata}
                submitting={actions.submittingCert}
                uploadingProof={actions.uploadingCertProof}
                items={candidateData?.chungChis ?? []}
                onCreate={actions.createCertificate}
                onUpdate={actions.updateCertificate}
                onDelete={(item) => void actions.handleDeleteCertificate(item)}
                onToggleSelection={(item) => void actions.handleToggleCertificateSelection(item)}
                onUploadProof={actions.uploadCertificateProof}
              />
            </section>

            <section className="sticky bottom-4 z-20 mt-6 rounded-lg border border-teal-200 bg-white/95 p-4 shadow-lg backdrop-blur">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Lưu hồ sơ vào AI Matching</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Các thay đổi phía trên đã lưu vào hồ sơ. Bấm nút này một lần sau khi chỉnh xong để cập nhật chỉ mục Qdrant.
                  </p>
                  {actions.hasUnsyncedProfileChanges ? (
                    <p className="mt-1 text-xs font-medium text-amber-700">Có thay đổi chưa đồng bộ AI.</p>
                  ) : (
                    <p className="mt-1 text-xs font-medium text-teal-700">Hồ sơ đã sẵn sàng cho AI Matching.</p>
                  )}
                </div>
                <ProfileActionButton
                  type="button"
                  disabled={actions.savingProfileIndex}
                  onClick={() => void actions.handleSaveProfileIndex()}
                  className="shrink-0"
                >
                  {actions.savingProfileIndex ? "Đang lưu hồ sơ..." : "Lưu hồ sơ"}
                </ProfileActionButton>
              </div>
            </section>
          </>
        )}
      </main>
      <HomeFooter />
    </div>
  );
}

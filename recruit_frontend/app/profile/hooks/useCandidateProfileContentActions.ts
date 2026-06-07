"use client";

import { type Dispatch, type SetStateAction } from "react";
import type { CandidateProfile } from "@/services/candidate/candidate-profile.service";
import { useCertificateActions } from "./useCertificateActions";
import { useEducationActions } from "./useEducationActions";
import { useWorkExperienceActions } from "./useWorkExperienceActions";

type UseCandidateProfileContentActionsParams = {
  activeProfileId: number | null;
  setCandidateData: Dispatch<SetStateAction<CandidateProfile | null>>;
  markProfileIndexDirty: () => void;
};

// Orchestrator: CRUD học vấn, chứng chỉ và kinh nghiệm làm việc cho profile candidate.
export function useCandidateProfileContentActions({
  activeProfileId,
  setCandidateData,
  markProfileIndexDirty,
}: UseCandidateProfileContentActionsParams) {
  const params = { activeProfileId, setCandidateData, markProfileIndexDirty };

  const edu = useEducationActions(params);
  const cert = useCertificateActions(params);
  const exp = useWorkExperienceActions(params);

  return {
    submittingEdu: edu.submittingEdu,
    submittingExp: exp.submittingExp,
    submittingCert: cert.submittingCert,
    createEducation: edu.createEducation,
    updateEducation: edu.updateEducation,
    handleDeleteEducation: edu.handleDeleteEducation,
    createCertificate: cert.createCertificate,
    updateCertificate: cert.updateCertificate,
    handleDeleteCertificate: cert.handleDeleteCertificate,
    createWorkExperience: exp.createWorkExperience,
    updateWorkExperience: exp.updateWorkExperience,
    handleDeleteWorkExperience: exp.handleDeleteWorkExperience,
    handleToggleEducationSelection: edu.handleToggleEducationSelection,
    handleToggleCertificateSelection: cert.handleToggleCertificateSelection,
    handleToggleWorkExperienceSelection: exp.handleToggleWorkExperienceSelection,
  };
}

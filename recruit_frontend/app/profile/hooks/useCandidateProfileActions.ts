"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import type { UserProfileResponse } from "@/services/auth/auth.service";
import type {
  CandidateProfile,
  CandidateProfileListItem,
} from "@/services/candidate/candidate-profile.service";
import type { PersonalInfoFormState } from "../components/PersonalInfoPanel";
import type { SummaryFormState } from "./useCandidateProfileData";
import { useCandidateProfileContentActions } from "./useCandidateProfileContentActions";
import { useCandidateProfileMediaActions } from "./useCandidateProfileMediaActions";
import { useCandidateProfilePreferenceActions } from "./useCandidateProfilePreferenceActions";
import { useCandidateProfileSummaryActions } from "./useCandidateProfileSummaryActions";

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

// Facade cho page profile: giữ public API cũ, còn mutation thật đã tách theo nhóm nghiệp vụ.
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
  const [unsyncedProfileId, setUnsyncedProfileId] = useState<number | null>(null);
  const hasUnsyncedProfileChanges = activeProfileId != null && unsyncedProfileId === activeProfileId;

  const markProfileIndexDirty = () => {
    if (activeProfileId != null) {
      setUnsyncedProfileId(activeProfileId);
    }
  };

  const mediaActions = useCandidateProfileMediaActions({ setProfile });
  const contentActions = useCandidateProfileContentActions({
    activeProfileId,
    setCandidateData,
    markProfileIndexDirty,
  });
  const preferenceActions = useCandidateProfilePreferenceActions({
    activeProfileId,
    selectedSkillIds,
    selectedIndustryIds,
    setCandidateData,
    setSelectedSkillIds,
    setSelectedIndustryIds,
    markProfileIndexDirty,
  });
  const summaryActions = useCandidateProfileSummaryActions({
    activeProfileId,
    profiles,
    summaryForm,
    personalInfoForm,
    setProfile,
    setProfiles,
    setActiveProfileId,
    setCandidateData,
    setSummaryForm,
    setPersonalInfoForm,
    setUnsyncedProfileId,
    markProfileIndexDirty,
  });

  return {
    ...mediaActions,
    ...contentActions,
    ...preferenceActions,
    ...summaryActions,
    hasUnsyncedProfileChanges,
  };
}

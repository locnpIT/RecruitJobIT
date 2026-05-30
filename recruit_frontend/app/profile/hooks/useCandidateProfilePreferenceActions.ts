"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import {
  candidateProfileService,
  type CandidateProfile,
} from "@/services/candidate/candidate-profile.service";

type UseCandidateProfilePreferenceActionsParams = {
  activeProfileId: number | null;
  selectedSkillIds: number[];
  selectedIndustryIds: number[];
  setCandidateData: Dispatch<SetStateAction<CandidateProfile | null>>;
  setSelectedSkillIds: Dispatch<SetStateAction<number[]>>;
  setSelectedIndustryIds: Dispatch<SetStateAction<number[]>>;
  markProfileIndexDirty: () => void;
};

export function useCandidateProfilePreferenceActions({
  activeProfileId,
  selectedSkillIds,
  selectedIndustryIds,
  setCandidateData,
  setSelectedSkillIds,
  setSelectedIndustryIds,
  markProfileIndexDirty,
}: UseCandidateProfilePreferenceActionsParams) {
  const [savingSkills, setSavingSkills] = useState(false);
  const [savingIndustries, setSavingIndustries] = useState(false);

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

  return {
    savingSkills,
    savingIndustries,
    toggleSkill,
    handleSaveSkills,
    toggleIndustry,
    handleSaveIndustries,
  };
}

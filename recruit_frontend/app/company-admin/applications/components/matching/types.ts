export type ApplicationMatchingMode = "applications" | "job-to-candidates";

export type ApplicationMatchingJobOption = {
  id: number;
  title: string;
};

export type ApplicationCandidateMatch = {
  matchKey: string;
  applicationId: number | null;
  jobId: number | null;
  profileId: number | null;
  candidateName: string;
  candidateEmail: string;
  candidateAvatarUrl: string | null;
  profileTitle: string;
  jobTitle: string;
  status: string | null;
  score: number;
  matchedSignals: string[];
  strengths: string[];
  relevantExperiences: string[];
  gaps: string[];
  reason: string;
  actionSuggestion: string | null;
};

export type ApplicationMatchingMode = "applications" | "job-to-candidates" | "candidate-to-jobs";

export type ApplicationMatchingJobOption = {
  id: number;
  title: string;
};

export type ApplicationMatchingCandidateOption = {
  id: number;
  name: string;
  profileTitle: string;
};

export type ApplicationCandidateMatch = {
  matchKey: string;
  applicationId: number | null;
  profileId: number | null;
  candidateName: string;
  candidateEmail: string;
  profileTitle: string;
  jobTitle: string;
  status: string | null;
  score: number;
  matchedSignals: string[];
  gaps: string[];
  reason: string;
};

export type ApplicationJobMatch = {
  applicationId: number;
  candidateName: string;
  jobId: number;
  jobTitle: string;
  status: string | null;
  score: number;
  matchedSignals: string[];
  gaps: string[];
  reason: string;
};

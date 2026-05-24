"use client";

import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "@/lib/api-error";
import { companyAdminJobsService } from "@/services/company-admin/jobs.service";
import type { CompanyAdminApplication, CompanyCandidateSemanticMatch } from "@/services/company-admin/types";
import type {
  ApplicationCandidateMatch,
  ApplicationMatchingMode,
} from "../components/matching/types";

type ApiErrorLike = {
  response?: {
    status?: number;
  };
};

// Dùng cho màn company-admin/applications: danh sách đơn thường và AI matching.
// Tab "AI theo tin" chỉ dùng Qdrant để dễ kiểm chứng semantic search.
export function useApplicationsMatchingPreview(applications: CompanyAdminApplication[], activeFilterJobId?: string) {
  const jobs = useMemo(() => {
    const uniqueJobs = new Map<number, string>();
    applications.forEach((application) => {
      if (application.tinTuyenDungId) {
        uniqueJobs.set(
          application.tinTuyenDungId,
          application.tieuDeTinTuyenDung ?? `Tin #${application.tinTuyenDungId}`
        );
      }
    });
    return Array.from(uniqueJobs.entries()).map(([id, title]) => ({ id, title }));
  }, [applications]);

  const [mode, setMode] = useState<ApplicationMatchingMode>("applications");
  const [selectedJobId, setSelectedJobId] = useState(0);
  const [minimumScore, setMinimumScore] = useState(20);
  const [selectedMatchKey, setSelectedMatchKey] = useState<string | null>(null);
  const [semanticMatches, setSemanticMatches] = useState<ApplicationCandidateMatch[]>([]);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [semanticError, setSemanticError] = useState("");

  const filterJobId = activeFilterJobId ? Number(activeFilterJobId) : 0;
  const preferredJobId = filterJobId || selectedJobId;
  const effectiveJobId = jobs.some((job) => job.id === preferredJobId) ? preferredJobId : jobs[0]?.id ?? 0;

  useEffect(() => {
    if (mode !== "job-to-candidates" || !effectiveJobId) {
      Promise.resolve().then(() => {
        setSemanticMatches([]);
        setSemanticLoading(false);
        setSemanticError("");
      });
      return;
    }

    let active = true;

    Promise.resolve()
      .then(() => {
        if (!active) {
          return [];
        }
        setSemanticLoading(true);
        setSemanticError("");
        return companyAdminJobsService.getCandidateMatches(effectiveJobId, 10);
      })
      .then((data) => {
        if (!active) {
          return;
        }
        setSemanticMatches(
          data
            .map((match) => mapSemanticCandidateMatch(match, applications, effectiveJobId))
            .filter((match) => match.score >= minimumScore)
        );
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        setSemanticMatches([]);
        setSemanticError(resolveSemanticErrorMessage(error));
      })
      .finally(() => {
        if (active) {
          setSemanticLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [applications, effectiveJobId, minimumScore, mode]);

  const candidateMatches = semanticMatches;

  const selectedCandidateMatch = useMemo(
    () => candidateMatches.find((match) => match.matchKey === selectedMatchKey) ?? candidateMatches[0] ?? null,
    [candidateMatches, selectedMatchKey]
  );

  return {
    mode,
    setMode,
    jobs,
    selectedJobId: effectiveJobId,
    setSelectedJobId,
    minimumScore,
    setMinimumScore,
    candidateMatches,
    semanticLoading,
    semanticError,
    selectedCandidateMatch,
    selectCandidateMatch: setSelectedMatchKey,
  };
}

function resolveSemanticErrorMessage(error: unknown) {
  const status = (error as ApiErrorLike | undefined)?.response?.status;
  const fallback = "Chưa lấy được dữ liệu Qdrant.";

  if (status === 401 || status === 403) {
    return "Bạn chưa có quyền dùng AI Matching cho tin này hoặc tin không thuộc phạm vi chi nhánh hiện tại.";
  }

  return getApiErrorMessage(error, fallback);
}

function mapSemanticCandidateMatch(
  match: CompanyCandidateSemanticMatch,
  applications: CompanyAdminApplication[],
  jobId: number
): ApplicationCandidateMatch {
  const profileId = match.hoSoUngVienId ?? null;
  const application = findApplicationForSemanticMatch(match, applications, jobId);
  const applicationId = application?.id ?? null;

  return {
    matchKey: applicationId
      ? `application-${applicationId}`
      : `profile-${profileId ?? match.nguoiDungId ?? match.ungVienHoTen ?? "unknown"}`,
    applicationId,
    profileId,
    candidateName: match.ungVienHoTen ?? "--",
    candidateEmail: match.email ?? "--",
    profileTitle: match.tenHoSo ?? resolveProfileTitle(application) ?? "Hồ sơ ứng viên",
    jobTitle: application?.tieuDeTinTuyenDung ?? "Kết quả Qdrant",
    status: application?.trangThai ?? null,
    score: Math.round(match.diemPhuHop ?? 0),
    matchedSignals: match.tinHieuKhop ?? [],
    strengths: match.diemManh ?? [],
    relevantExperiences: match.kinhNghiemLienQuan ?? [],
    gaps: match.canKiemTraThem ?? [],
    reason:
      match.lyDoPhuHop ??
      `${match.ungVienHoTen ?? "Ứng viên"} được Qdrant xếp hạng theo độ tương đồng vector với tin tuyển dụng đang chọn.`,
    actionSuggestion: match.goiYHanhDong ?? null,
  };
}

function findApplicationForSemanticMatch(
  match: CompanyCandidateSemanticMatch,
  applications: CompanyAdminApplication[],
  jobId: number
) {
  const matchEmail = normalizeEmail(match.email);

  return applications.find((application) => {
    if (application.tinTuyenDungId !== jobId) {
      return false;
    }
    if (match.hoSoUngVienId && application.hoSoUngVienId === match.hoSoUngVienId) {
      return true;
    }
    if (match.nguoiDungId && application.nguoiDungId === match.nguoiDungId) {
      return true;
    }
    return Boolean(matchEmail && normalizeEmail(application.ungVienEmail) === matchEmail);
  });
}

function resolveProfileTitle(application?: CompanyAdminApplication | null) {
  const firstSkill = application?.kyNangs?.find((skill) => skill.ten)?.ten;
  const major = application?.hocVans?.find((education) => education.chuyenNganh)?.chuyenNganh;
  return firstSkill ?? major ?? "Hồ sơ ứng viên";
}

function normalizeEmail(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

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
  const [mode, setMode] = useState<ApplicationMatchingMode>("applications");
  const [minimumScore, setMinimumScore] = useState(20);
  const [selectedMatchKey, setSelectedMatchKey] = useState<string | null>(null);
  const [semanticMatches, setSemanticMatches] = useState<ApplicationCandidateMatch[]>([]);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [semanticError, setSemanticError] = useState("");
  const [applicationMatches, setApplicationMatches] = useState<ApplicationCandidateMatch[]>([]);
  const [applicationSemanticLoading, setApplicationSemanticLoading] = useState(false);
  const [applicationSemanticError, setApplicationSemanticError] = useState("");

  const effectiveJobId = activeFilterJobId ? Number(activeFilterJobId) : 0;
  const selectedJobTitle = useMemo(
    () =>
      applications.find((application) => application.tinTuyenDungId === effectiveJobId)?.tieuDeTinTuyenDung ??
      (effectiveJobId ? `Tin #${effectiveJobId}` : "Tin tuyển dụng đang lọc"),
    [applications, effectiveJobId]
  );

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

  useEffect(() => {
    if (mode !== "applications" || !effectiveJobId) {
      Promise.resolve().then(() => {
        setApplicationMatches([]);
        setApplicationSemanticLoading(false);
        setApplicationSemanticError("");
      });
      return;
    }

    let active = true;
    const submittedApplicationCount = applications.filter((application) => application.tinTuyenDungId === effectiveJobId).length;
    const limit = Math.max(submittedApplicationCount, 10);

    Promise.resolve()
      .then(() => {
        if (!active) {
          return [];
        }
        setApplicationSemanticLoading(true);
        setApplicationSemanticError("");
        return companyAdminJobsService.getApplicationMatches(effectiveJobId, limit);
      })
      .then((data) => {
        if (!active) {
          return;
        }
        setApplicationMatches(
          data
            .map((match) => mapSemanticCandidateMatch(match, applications, effectiveJobId))
            .filter((match) => match.applicationId != null)
        );
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        setApplicationMatches([]);
        setApplicationSemanticError(resolveSemanticErrorMessage(error));
      })
      .finally(() => {
        if (active) {
          setApplicationSemanticLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [applications, effectiveJobId, mode]);

  const candidateMatches = semanticMatches;

  const selectedCandidateMatch = useMemo(
    () => candidateMatches.find((match) => match.matchKey === selectedMatchKey) ?? candidateMatches[0] ?? null,
    [candidateMatches, selectedMatchKey]
  );
  const selectedApplicationMatch = useMemo(
    () => applicationMatches.find((match) => match.matchKey === selectedMatchKey) ?? applicationMatches[0] ?? null,
    [applicationMatches, selectedMatchKey]
  );

  return {
    mode,
    setMode,
    selectedJobId: effectiveJobId,
    selectedJobTitle,
    minimumScore,
    setMinimumScore,
    candidateMatches,
    applicationMatches,
    selectedApplicationMatch,
    applicationSemanticLoading,
    applicationSemanticError,
    semanticLoading,
    semanticError,
    selectedCandidateMatch,
    selectCandidateMatch: setSelectedMatchKey,
    selectApplicationMatch: setSelectedMatchKey,
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
    jobId,
    profileId,
    candidateName: match.ungVienHoTen ?? "--",
    candidateEmail: match.email ?? "--",
    candidateAvatarUrl: match.anhDaiDienUrl ?? application?.ungVienAnhDaiDienUrl ?? null,
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
    if (match.donUngTuyenId && application.id === match.donUngTuyenId) {
      return true;
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

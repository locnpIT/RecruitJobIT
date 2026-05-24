"use client";

import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "@/lib/api-error";
import { companyAdminJobsService } from "@/services/company-admin/jobs.service";
import type { CompanyAdminApplication, CompanyCandidateSemanticMatch } from "@/services/company-admin/types";
import type {
  ApplicationCandidateMatch,
  ApplicationJobMatch,
  ApplicationMatchingMode,
} from "../components/matching/types";

const STATUS_SCORE: Record<string, number> = {
  ACCEPTED: 8,
  REVIEWING: 5,
  PENDING: 2,
  REJECTED: -8,
};

type ApiErrorLike = {
  response?: {
    status?: number;
  };
};

// Dùng cho màn company-admin/applications: danh sách đơn thường và preview AI matching từ dữ liệu đơn ứng tuyển.
// Tab "AI theo tin" ưu tiên dùng Qdrant; nếu backend/vector chưa sẵn sàng thì fallback về preview local.
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

  const candidates = useMemo(() => {
    const uniqueCandidates = new Map<number, { name: string; profileTitle: string }>();
    applications.forEach((application) => {
      if (application.nguoiDungId) {
        uniqueCandidates.set(application.nguoiDungId, {
          name: application.ungVienHoTen ?? `Ứng viên #${application.nguoiDungId}`,
          profileTitle: resolveProfileTitle(application),
        });
      }
    });
    return Array.from(uniqueCandidates.entries()).map(([id, value]) => ({ id, ...value }));
  }, [applications]);

  const [mode, setMode] = useState<ApplicationMatchingMode>("applications");
  const [selectedJobId, setSelectedJobId] = useState(0);
  const [selectedCandidateId, setSelectedCandidateId] = useState(candidates[0]?.id ?? 0);
  const [minimumScore, setMinimumScore] = useState(70);
  const [selectedMatchKey, setSelectedMatchKey] = useState<string | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [semanticMatches, setSemanticMatches] = useState<ApplicationCandidateMatch[]>([]);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [semanticError, setSemanticError] = useState("");

  const filterJobId = activeFilterJobId ? Number(activeFilterJobId) : 0;
  const preferredJobId = filterJobId || selectedJobId;
  const effectiveJobId = jobs.some((job) => job.id === preferredJobId) ? preferredJobId : jobs[0]?.id ?? 0;
  const effectiveCandidateId = candidates.some((candidate) => candidate.id === selectedCandidateId)
    ? selectedCandidateId
    : candidates[0]?.id ?? 0;

  const previewCandidateMatches = useMemo<ApplicationCandidateMatch[]>(() => {
    return applications
      .filter((application) => !effectiveJobId || application.tinTuyenDungId === effectiveJobId)
      .map((application) => buildCandidateMatch(application))
      .filter((match): match is ApplicationCandidateMatch => match !== null && match.score >= minimumScore)
      .sort((a, b) => b.score - a.score);
  }, [applications, effectiveJobId, minimumScore]);

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

  const candidateMatches = semanticMatches.length > 0 ? semanticMatches : previewCandidateMatches;

  const jobMatches = useMemo<ApplicationJobMatch[]>(() => {
    return applications
      .filter((application) => !effectiveCandidateId || application.nguoiDungId === effectiveCandidateId)
      .map((application) => buildJobMatch(application))
      .filter((match): match is ApplicationJobMatch => match !== null && match.score >= minimumScore)
      .sort((a, b) => b.score - a.score);
  }, [applications, effectiveCandidateId, minimumScore]);

  const selectedCandidateMatch = useMemo(
    () => candidateMatches.find((match) => match.matchKey === selectedMatchKey) ?? candidateMatches[0] ?? null,
    [candidateMatches, selectedMatchKey]
  );

  const selectedJobMatch = useMemo(
    () => jobMatches.find((match) => match.applicationId === selectedApplicationId) ?? jobMatches[0] ?? null,
    [jobMatches, selectedApplicationId]
  );

  return {
    mode,
    setMode,
    jobs,
    candidates,
    selectedJobId: effectiveJobId,
    setSelectedJobId,
    selectedCandidateId: effectiveCandidateId,
    setSelectedCandidateId,
    minimumScore,
    setMinimumScore,
    candidateMatches,
    usingSemanticMatches: semanticMatches.length > 0,
    semanticLoading,
    semanticError,
    jobMatches,
    selectedCandidateMatch,
    selectedJobMatch,
    selectCandidateMatch: setSelectedMatchKey,
    selectApplication: setSelectedApplicationId,
  };
}

function resolveSemanticErrorMessage(error: unknown) {
  const status = (error as ApiErrorLike | undefined)?.response?.status;
  const fallback = "Chưa lấy được dữ liệu Qdrant, đang hiển thị preview từ đơn ứng tuyển.";

  if (status === 401 || status === 403) {
    return "Bạn chưa có quyền dùng AI Matching cho tin này hoặc tin không thuộc phạm vi chi nhánh hiện tại. Đang hiển thị preview từ đơn ứng tuyển.";
  }

  return getApiErrorMessage(error, fallback);
}

function buildCandidateMatch(application: CompanyAdminApplication): ApplicationCandidateMatch | null {
  if (!application.id) {
    return null;
  }

  const signals = resolveSignals(application);
  const score = calculatePreviewScore(application, signals);

  return {
    matchKey: `application-${application.id}`,
    applicationId: application.id,
    profileId: application.hoSoUngVienId,
    candidateName: application.ungVienHoTen ?? "--",
    candidateEmail: application.ungVienEmail ?? "--",
    profileTitle: resolveProfileTitle(application),
    jobTitle: application.tieuDeTinTuyenDung ?? "--",
    status: application.trangThai,
    score,
    matchedSignals: signals.slice(0, 5),
    gaps: resolveGaps(application),
    reason: buildReason(application, score),
  };
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
    gaps: match.canKiemTraThem ?? [],
    reason: `${match.ungVienHoTen ?? "Ứng viên"} được Qdrant xếp hạng theo độ tương đồng vector với tin tuyển dụng đang chọn.`,
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

function buildJobMatch(application: CompanyAdminApplication): ApplicationJobMatch | null {
  if (!application.id || !application.tinTuyenDungId) {
    return null;
  }

  const signals = resolveSignals(application);
  const score = calculatePreviewScore(application, signals);

  return {
    applicationId: application.id,
    candidateName: application.ungVienHoTen ?? "--",
    jobId: application.tinTuyenDungId,
    jobTitle: application.tieuDeTinTuyenDung ?? "--",
    status: application.trangThai,
    score,
    matchedSignals: signals.slice(0, 5),
    gaps: resolveGaps(application),
    reason: buildReason(application, score),
  };
}

function calculatePreviewScore(application: CompanyAdminApplication, signals: string[]) {
  const status = application.trangThai?.toUpperCase() ?? "";
  const hasProfileText = Boolean(application.gioiThieuBanThan || application.mucTieuNgheNghiep);
  const hasCv = Boolean(application.cvUrl);
  const hasVerifiedEvidence = [...(application.hocVans ?? []), ...(application.chungChis ?? [])].some(
    (item) => item.trangThai?.toUpperCase() === "APPROVED"
  );

  const rawScore =
    62
    + Math.min(signals.length * 4, 18)
    + (hasProfileText ? 6 : 0)
    + (hasCv ? 5 : 0)
    + (hasVerifiedEvidence ? 5 : 0)
    + (STATUS_SCORE[status] ?? 0);

  return Math.max(45, Math.min(rawScore, 96));
}

function resolveSignals(application: CompanyAdminApplication) {
  const skills = (application.kyNangs ?? [])
    .map((skill) => skill.ten)
    .filter((skill): skill is string => Boolean(skill));
  const certificateNames = (application.chungChis ?? [])
    .map((certificate) => certificate.tenChungChi ?? certificate.loaiChungChiTen)
    .filter((certificate): certificate is string => Boolean(certificate));
  const educationNames = (application.hocVans ?? [])
    .map((education) => education.chuyenNganh ?? education.bacHoc ?? education.tenTruong)
    .filter((education): education is string => Boolean(education));

  const titleTokens = splitTitleTokens(application.tieuDeTinTuyenDung);
  const allSignals = [...skills, ...certificateNames, ...educationNames, ...titleTokens];

  return Array.from(new Set(allSignals)).slice(0, 8);
}

function resolveGaps(application: CompanyAdminApplication) {
  const gaps: string[] = [];
  if (!application.cvUrl) {
    gaps.push("Chưa có CV đính kèm");
  }
  if (!(application.kyNangs ?? []).length) {
    gaps.push("Thiếu dữ liệu kỹ năng trong hồ sơ");
  }
  if (!application.gioiThieuBanThan && !application.mucTieuNgheNghiep) {
    gaps.push("Thiếu mô tả hồ sơ");
  }
  if (application.trangThai?.toUpperCase() === "REJECTED") {
    gaps.push("Đơn từng bị từ chối");
  }
  return gaps.length ? gaps : ["Không có khoảng trống lớn"];
}

function resolveProfileTitle(application?: CompanyAdminApplication | null) {
  const firstSkill = application?.kyNangs?.find((skill) => skill.ten)?.ten;
  const major = application?.hocVans?.find((education) => education.chuyenNganh)?.chuyenNganh;
  return firstSkill ?? major ?? "Hồ sơ ứng viên";
}

function normalizeEmail(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function buildReason(application: CompanyAdminApplication, score: number) {
  const candidateName = application.ungVienHoTen ?? "Ứng viên";
  const jobTitle = application.tieuDeTinTuyenDung ?? "tin tuyển dụng";
  if (score >= 85) {
    return `${candidateName} có nhiều tín hiệu hồ sơ phù hợp với ${jobTitle}; nên ưu tiên xem chi tiết hoặc nhắn tin.`;
  }
  if (score >= 70) {
    return `${candidateName} có mức phù hợp khá với ${jobTitle}; cần kiểm tra thêm CV và minh chứng trước khi quyết định.`;
  }
  return `${candidateName} có ít tín hiệu phù hợp rõ ràng; nên xem thêm hồ sơ chi tiết nếu cần.`;
}

function splitTitleTokens(title?: string | null) {
  if (!title) {
    return [];
  }
  return title
    .split(/[\s,;/.-]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3)
    .slice(0, 4);
}

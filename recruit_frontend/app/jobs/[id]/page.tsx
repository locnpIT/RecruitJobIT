"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Bell } from "lucide-react";
import { HomeFooter } from "@/app/components/home/HomeFooter";
import { HomeHeader } from "@/app/components/home/HomeHeader";
import { clearAdminSession, getJwtExpiryMs } from "@/lib/admin-session";
import { authService } from "@/services/auth.service";
import { candidateApplicationService } from "@/services/candidate-application.service";
import {
  candidateProfileService,
  type CandidateProfileListItem,
} from "@/services/candidate-profile.service";
import { publicJobService, type PublicJobDetail } from "@/services/public-job.service";
import { JobApplyModal } from "./components/JobApplyModal";
import { JobDescriptionPanel } from "./components/JobDescriptionPanel";
import { JobDetailHero } from "./components/JobDetailHero";
import { JobSidebar } from "./components/JobSidebar";

type LocalUser = {
  vaiTro?: string;
};

// Trang public chi tiết tin tuyển dụng.
// Route nhận id từ URL `/jobs/[id]`, gọi backend public API để chỉ hiển thị tin:
// APPROVED, chưa hết hạn và thuộc công ty đã được duyệt.
export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const jobId = params.id;
  const [job, setJob] = useState<PublicJobDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [profiles, setProfiles] = useState<CandidateProfileListItem[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applyNotice, setApplyNotice] = useState("");
  const [isCandidate, setIsCandidate] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Trang detail vẫn SSR HTML ban đầu, nên không đọc localStorage trong render.
    // Đọc session sau mount giúp server/client markup đầu tiên giống nhau và tránh hydration mismatch.
    Promise.resolve().then(() => {
      if (!isMounted) {
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const expiresAt = token ? getJwtExpiryMs(token) : null;

        if (!token || (expiresAt !== null && expiresAt <= Date.now())) {
          clearAdminSession();
          setIsCandidate(false);
          return;
        }

        const raw = localStorage.getItem("user");
        const user = raw ? (JSON.parse(raw) as LocalUser) : null;
        setIsCandidate(user?.vaiTro?.toUpperCase() === "CANDIDATE");
      } catch {
        clearAdminSession();
        setIsCandidate(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    publicJobService
      .getJobDetail(jobId)
      .then((data) => {
        if (!isMounted) {
          return;
        }
        setJob(data);
        setError("");
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setError("Tin tuyển dụng không tồn tại, chưa được duyệt hoặc đã hết hạn.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [jobId]);

  useEffect(() => {
    if (!isCandidate || !job?.id) {
      return;
    }

    let isMounted = true;
    publicJobService
      .getFavoriteStatus(job.id)
      .then((data) => {
        if (isMounted) {
          setIsFavorite(Boolean(data.favorite));
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsFavorite(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isCandidate, job?.id]);

  useEffect(() => {
    if (!isCandidate || !job?.id) {
      return;
    }

    let isMounted = true;
    candidateApplicationService
      .getApplicationStatus(job.id)
      .then((data) => {
        if (isMounted) {
          setHasApplied(Boolean(data.applied));
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasApplied(false);
        }
      })
      .finally(() => {
        if (isMounted) {
          setApplicationLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isCandidate, job?.id]);

  // Toggle yêu thích dùng bảng NguoiDungTinTuyenDung hiện có.
  // Nếu chưa đăng nhập candidate thì đưa user sang login thay vì gọi API private.
  const handleToggleFavorite = async () => {
    if (!job?.id) {
      return;
    }
    if (!isCandidate) {
      window.location.href = "/auth/login";
      return;
    }

    setFavoriteLoading(true);
    try {
      const response = isFavorite
        ? await publicJobService.removeFavorite(job.id)
        : await publicJobService.addFavorite(job.id);
      setIsFavorite(Boolean(response.favorite));
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Mở modal ứng tuyển. Nếu chưa đăng nhập candidate thì chuyển login,
  // còn nếu đã là candidate thì tải danh sách hồ sơ để user chọn.
  const handleOpenApplyModal = async () => {
    if (!job?.id) {
      return;
    }
    if (!isCandidate) {
      window.location.href = "/auth/login";
      return;
    }
    if (hasApplied) {
      return;
    }

    setApplyError("");
    setApplyNotice("");
    setApplyModalOpen(true);

    if (profiles.length === 0) {
      try {
        const data = await candidateProfileService.listProfiles();
        setProfiles(data);
        if (data.length === 1) {
          setSelectedProfileId(String(data[0].id));
        }
      } catch {
        setApplyError("Không tải được danh sách hồ sơ ứng viên.");
      }
    }
  };

  // Submit ứng tuyển theo rule đã chốt:
  // luôn gửi hoSoUngVienId; nếu job bắt buộc CV thì upload file lên Cloudinary rồi gửi cvUrl.
  const handleSubmitApplication = async () => {
    if (!job?.id) {
      return;
    }
    if (!selectedProfileId) {
      setApplyError("Vui lòng chọn hồ sơ ứng viên.");
      return;
    }
    if (job.batBuocCv && !cvFile) {
      setApplyError("Tin này bắt buộc nộp file CV.");
      return;
    }

    setApplySubmitting(true);
    setApplyError("");
    try {
      let cvUrl: string | undefined;
      if (job.batBuocCv && cvFile) {
        const signature = await authService.getCloudinarySignature("proof");
        cvUrl = await authService.uploadToCloudinary(cvFile, signature);
      }

      await candidateApplicationService.applyToJob(job.id, {
        hoSoUngVienId: Number(selectedProfileId),
        cvUrl,
      });
      setHasApplied(true);
      setApplyModalOpen(false);
      setCvFile(null);
      setApplyNotice("Ứng tuyển thành công. Nhà tuyển dụng sẽ xem hồ sơ của bạn trong hệ thống.");
    } catch {
      setApplyError("Không thể gửi ứng tuyển. Vui lòng kiểm tra thông tin và thử lại.");
    } finally {
      setApplySubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <HomeHeader />
      <main>
        {isLoading ? (
          <section className="mx-auto w-full max-w-6xl px-4 py-16">
            <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
              Đang tải chi tiết tin tuyển dụng...
            </div>
          </section>
        ) : null}

        {!isLoading && error ? (
          <section className="mx-auto w-full max-w-6xl px-4 py-16">
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <p className="text-lg font-semibold text-slate-950">Không tìm thấy tin tuyển dụng</p>
              <p className="mt-2 text-sm text-slate-600">{error}</p>
              <Link
                href="/"
                className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Về trang chủ
              </Link>
            </div>
          </section>
        ) : null}

        {!isLoading && job ? (
          <>
            <JobDetailHero
              job={job}
              isFavorite={isFavorite}
              favoriteLoading={favoriteLoading}
              onToggleFavorite={handleToggleFavorite}
            />

            <section className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-6 lg:grid-cols-[1fr_360px] lg:py-7">
              <JobDescriptionPanel job={job} />
              <JobSidebar
                job={job}
                isFavorite={isFavorite}
                favoriteLoading={favoriteLoading}
                isApplied={hasApplied}
                applicationLoading={applicationLoading}
                onToggleFavorite={handleToggleFavorite}
                onApply={handleOpenApplyModal}
              />
            </section>

            <section className="mx-auto w-full max-w-6xl px-4 pb-10">
              {applyNotice ? (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800">
                  {applyNotice}
                </div>
              ) : null}
              <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-900">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950">Nhận việc làm phù hợp với bạn</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Đăng ký để nhận các công việc mới nhất theo kỹ năng và mong muốn của bạn.
                    </p>
                  </div>
                </div>
                <Link
                  href="/auth/register/candidate"
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                >
                  Đăng ký nhận việc
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>

            <JobApplyModal
              open={applyModalOpen}
              job={job}
              profiles={profiles}
              selectedProfileId={selectedProfileId}
              cvFile={cvFile}
              submitting={applySubmitting}
              error={applyError}
              onSelectedProfileIdChange={setSelectedProfileId}
              onCvFileChange={setCvFile}
              onClose={() => setApplyModalOpen(false)}
              onSubmit={handleSubmitApplication}
            />
          </>
        ) : null}
      </main>
      <HomeFooter />
    </div>
  );
}

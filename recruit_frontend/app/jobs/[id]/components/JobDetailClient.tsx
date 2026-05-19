"use client";

import Link from "next/link";
import { HomeFooter } from "@/app/components/home/HomeFooter";
import { HomeHeader } from "@/app/components/home/HomeHeader";
import { JobApplySection } from "./JobApplySection";
import { JobApplyModal } from "./JobApplyModal";
import { JobDescriptionPanel } from "./JobDescriptionPanel";
import { JobDetailHero } from "./JobDetailHero";
import { JobSidebar } from "./JobSidebar";
import { useJobDetail } from "../hooks/useJobDetail";

type JobDetailClientProps = {
  jobId: string;
};

// Client container cho trang jobs/[id].
export function JobDetailClient({ jobId }: JobDetailClientProps) {
  const jobDetail = useJobDetail(jobId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <HomeHeader />
      <main>
        {jobDetail.isLoading ? (
          <section className="mx-auto w-full max-w-6xl px-4 py-16">
            <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
              Đang tải chi tiết tin tuyển dụng...
            </div>
          </section>
        ) : null}

        {!jobDetail.isLoading && jobDetail.error ? (
          <section className="mx-auto w-full max-w-6xl px-4 py-16">
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <p className="text-lg font-semibold text-slate-950">Không tìm thấy tin tuyển dụng</p>
              <p className="mt-2 text-sm text-slate-600">{jobDetail.error}</p>
              <Link
                href="/"
                className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Về trang chủ
              </Link>
            </div>
          </section>
        ) : null}

        {!jobDetail.isLoading && jobDetail.job ? (
          <>
            <JobDetailHero
              job={jobDetail.job}
              isFavorite={jobDetail.isFavorite}
              favoriteLoading={jobDetail.favoriteLoading}
              onToggleFavorite={jobDetail.handleToggleFavorite}
            />

            <section className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-6 lg:grid-cols-[1fr_360px] lg:py-7">
              <JobDescriptionPanel job={jobDetail.job} />
              <JobSidebar
                job={jobDetail.job}
                isFavorite={jobDetail.isFavorite}
                favoriteLoading={jobDetail.favoriteLoading}
                isApplied={jobDetail.hasApplied}
                applicationLoading={jobDetail.applicationLoading}
                chatLoading={jobDetail.chatLoading}
                onToggleFavorite={jobDetail.handleToggleFavorite}
                onApply={jobDetail.handleOpenApplyModal}
                onOpenChat={jobDetail.handleOpenChat}
              />
            </section>

            <JobApplySection
              chatOpenError={jobDetail.chatOpenError}
              applyNotice={jobDetail.applyNotice}
            />

            <JobApplyModal
              open={jobDetail.applyModalOpen}
              job={jobDetail.job}
              profiles={jobDetail.profiles}
              selectedProfileId={jobDetail.selectedProfileId}
              cvFile={jobDetail.cvFile}
              submitting={jobDetail.applySubmitting}
              error={jobDetail.applyError}
              onSelectedProfileIdChange={jobDetail.setSelectedProfileId}
              onCvFileChange={jobDetail.setCvFile}
              onClose={() => jobDetail.setApplyModalOpen(false)}
              onSubmit={jobDetail.handleSubmitApplication}
            />
          </>
        ) : null}
      </main>
      <HomeFooter />
    </div>
  );
}

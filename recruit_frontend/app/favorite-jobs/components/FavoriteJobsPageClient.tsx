"use client";

import { HomeFooter } from "@/app/components/home/HomeFooter";
import { HomeHeader } from "@/app/components/home/HomeHeader";
import { StateCard } from "@/app/components/shared/StateCard";
import { PublicJobCard } from "@/app/jobs/components/PublicJobCard";
import { FavoriteJobsEmptyState } from "./FavoriteJobsEmptyState";
import { FavoriteJobsHeader } from "./FavoriteJobsHeader";
import { useFavoriteJobs } from "../hooks/useFavoriteJobs";

// Client container cho trang /favorite-jobs.
export function FavoriteJobsPageClient() {
  const favoriteJobs = useFavoriteJobs();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <HomeHeader />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
        <FavoriteJobsHeader />

        {favoriteJobs.isLoading ? (
          <StateCard message="Đang tải việc làm yêu thích..." paddingClassName="p-5" />
        ) : null}

        {!favoriteJobs.isLoading && favoriteJobs.error ? (
          <StateCard message={favoriteJobs.error} tone="error" paddingClassName="p-5" />
        ) : null}

        {!favoriteJobs.isLoading && !favoriteJobs.error && favoriteJobs.jobs.length === 0 ? <FavoriteJobsEmptyState /> : null}

        {!favoriteJobs.isLoading && !favoriteJobs.error && favoriteJobs.jobs.length > 0 ? (
          <div className="space-y-3">
            {favoriteJobs.jobs.map((job) => (
              <PublicJobCard
                key={job.id}
                job={job}
                actionLabel="Bỏ lưu"
                actionLoading={favoriteJobs.removingJobId === job.id}
                onAction={favoriteJobs.handleRemoveFavorite}
              />
            ))}
          </div>
        ) : null}
      </main>
      <HomeFooter />
    </div>
  );
}

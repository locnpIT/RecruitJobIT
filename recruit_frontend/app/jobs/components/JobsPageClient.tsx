"use client";

import { HomeFooter } from "@/app/components/home/HomeFooter";
import { HomeHeader } from "@/app/components/home/HomeHeader";
import { JobsPagination } from "./JobsPagination";
import { JobsResultState } from "./JobsResultState";
import { JobsSearchFilters } from "./JobsSearchFilters";
import { PublicJobCard } from "./PublicJobCard";
import { useJobsSearch } from "../hooks/useJobsSearch";

// Client container cho trang /jobs.
export function JobsPageClient() {
  const jobsSearch = useJobsSearch();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <HomeHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-10">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Việc làm đang tuyển
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-slate-950 md:text-3xl">
            Danh sách tin tuyển dụng
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Tìm kiếm theo từ khóa, địa điểm và bộ lọc ngành nghề, loại hình, cấp độ kinh nghiệm.
          </p>
        </div>

        <JobsSearchFilters
          value={jobsSearch.filters}
          metadata={jobsSearch.metadata}
          onChange={jobsSearch.setFilters}
          onSubmit={() => void jobsSearch.handleSubmitFilters()}
          onReset={() => void jobsSearch.handleResetFilters()}
          loading={jobsSearch.isLoading}
        />

        <div className="mt-4">
          <JobsResultState
            loading={jobsSearch.isLoading}
            error={jobsSearch.error}
            empty={!jobsSearch.isLoading && !jobsSearch.error && jobsSearch.jobs.length === 0}
          />
        </div>

        {!jobsSearch.isLoading && !jobsSearch.error && jobsSearch.jobs.length > 0 ? (
          <div className="space-y-3">
            {jobsSearch.jobs.map((job) => (
              <PublicJobCard key={job.id} job={job} />
            ))}
            <JobsPagination
              currentPage={jobsSearch.searchState?.trang ?? 0}
              hasNext={Boolean(jobsSearch.searchState?.conTrangSau)}
              totalItems={jobsSearch.searchState?.tongSo}
              pageSize={jobsSearch.searchState?.kichThuoc ?? 12}
              onPrev={() => void jobsSearch.handlePrevPage()}
              onNext={() => void jobsSearch.handleNextPage()}
              disabled={jobsSearch.isLoading}
            />
          </div>
        ) : null}
      </main>
      <HomeFooter />
    </div>
  );
}

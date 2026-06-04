"use client";

import { HomeFooter } from "@/app/components/home/HomeFooter";
import { HomeHeader } from "@/app/components/home/HomeHeader";
import { StateCard } from "@/app/components/shared/StateCard";
import { PublicJobCard } from "@/app/jobs/components/PublicJobCard";
import { usePublicCompanyData } from "../hooks/usePublicCompanyData";
import { PublicCompanyHeader } from "./PublicCompanyHeader";

export function CompanyDetailClient({ companyId }: { companyId: string }) {
  const { company, jobs, loading, error } = usePublicCompanyData(companyId);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <HomeHeader />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
        {loading ? <StateCard message="Đang tải thông tin công ty..." paddingClassName="p-5" /> : null}
        {!loading && error ? <StateCard message={error} tone="error" paddingClassName="p-5" /> : null}

        {!loading && !error && company ? (
          <div className="space-y-6">
            <PublicCompanyHeader company={company} />

            <section>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-xl font-semibold text-slate-950">Tin tuyển dụng</h2>
                {jobs.length > 0 ? (
                  <span className="rounded-full bg-[#008080]/10 px-2.5 py-0.5 text-sm font-semibold text-[#008080]">
                    {jobs.length}
                  </span>
                ) : null}
              </div>
              {jobs.length === 0 ? (
                <StateCard message="Hiện chưa có tin tuyển dụng public từ công ty này." paddingClassName="p-5" />
              ) : (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <PublicJobCard key={job.id} job={job} />
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </main>
      <HomeFooter />
    </div>
  );
}

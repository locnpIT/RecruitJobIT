"use client";

import { HomeFooter } from "@/app/components/home/HomeFooter";
import { HomeHeader } from "@/app/components/home/HomeHeader";
import { StateCard } from "@/app/components/shared/StateCard";
import { PublicJobCard } from "@/app/jobs/components/PublicJobCard";
import { usePublicCompanyData } from "../hooks/usePublicCompanyData";
import { PublicCompanyHeader } from "./PublicCompanyHeader";

export function CompanyDetailClient({ companyId }: { companyId: string }) {
  const { company, jobs, loading, error, selectedBranchId, setSelectedBranchId } = usePublicCompanyData(companyId);

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
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-slate-950">Tin tuyển dụng</h2>
                  {jobs.length > 0 ? (
                    <span className="rounded-full bg-[#008080]/10 px-2.5 py-0.5 text-sm font-semibold text-[#008080]">
                      {jobs.length}
                    </span>
                  ) : null}
                </div>
                {company.chiNhanhs.length > 0 ? (
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="whitespace-nowrap font-medium">Chi nhánh</span>
                    <select
                      value={selectedBranchId ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        setSelectedBranchId(value ? Number(value) : null);
                      }}
                      className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                    >
                      <option value="">Tất cả chi nhánh</option>
                      {company.chiNhanhs.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.laTruSoChinh ? `${branch.ten} (Trụ sở chính)` : branch.ten}
                        </option>
                      ))}
                    </select>
                  </label>
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

"use client";

import { useParams } from "next/navigation";
import { HomeFooter } from "@/app/components/home/HomeFooter";
import { HomeHeader } from "@/app/components/home/HomeHeader";
import { StateCard } from "@/app/components/shared/StateCard";
import { PublicJobCard } from "@/app/jobs/components/PublicJobCard";
import { PublicCompanyHeader } from "./components/PublicCompanyHeader";
import { usePublicCompanyData } from "./hooks/usePublicCompanyData";

// Trang public profile công ty:
// - hiển thị thông tin công ty đã duyệt
// - liệt kê các tin tuyển dụng public đang còn hiệu lực của công ty đó.
export default function PublicCompanyPage() {
  const params = useParams<{ id: string }>();
  const companyId = params.id;
  const { company, jobs, loading, error } = usePublicCompanyData(companyId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <HomeHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
        {loading ? <StateCard message="Đang tải thông tin công ty..." paddingClassName="p-5" /> : null}
        {!loading && error ? <StateCard message={error} tone="error" paddingClassName="p-5" /> : null}

        {!loading && !error && company ? (
          <section className="space-y-6">
            <PublicCompanyHeader company={company} />

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Tin tuyển dụng của công ty</h2>
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
          </section>
        ) : null}
      </main>
      <HomeFooter />
    </div>
  );
}

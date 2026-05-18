"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { HomeFooter } from "@/app/components/home/HomeFooter";
import { HomeHeader } from "@/app/components/home/HomeHeader";
import { StateCard } from "@/app/components/shared/StateCard";
import { PublicJobCard } from "@/app/jobs/components/PublicJobCard";
import { publicCompanyService, type PublicCompanyDetail } from "@/services/public-company.service";
import type { PublicJobSummary } from "@/services/public-job.service";
import { PublicCompanyHeader } from "./components/PublicCompanyHeader";

// Trang public profile công ty:
// - hiển thị thông tin công ty đã duyệt
// - liệt kê các tin tuyển dụng public đang còn hiệu lực của công ty đó.
export default function PublicCompanyPage() {
  const params = useParams<{ id: string }>();
  const companyId = params.id;

  const [company, setCompany] = useState<PublicCompanyDetail | null>(null);
  const [jobs, setJobs] = useState<PublicJobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      publicCompanyService.getCompanyDetail(companyId),
      publicCompanyService.listCompanyJobs(companyId, 12),
    ])
      .then(([companyData, jobsData]) => {
        if (!isMounted) {
          return;
        }
        setCompany(companyData);
        setJobs(jobsData);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setError("Không tìm thấy công ty hoặc công ty chưa có dữ liệu public.");
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [companyId]);

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

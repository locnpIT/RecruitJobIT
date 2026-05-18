"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { publicJobService, type PublicJobSummary } from "@/services/public-job.service";
import { PublicJobCard } from "@/app/jobs/components/PublicJobCard";
import { StateCard } from "@/app/components/shared/StateCard";

// Section job nổi bật trên homepage.
// Đây là khối giới thiệu nhanh các tin đang tuyển để kéo người dùng đi vào funnel ứng tuyển.
export function FeaturedJobsSection() {
  const [publicJobs, setPublicJobs] = useState<PublicJobSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    publicJobService
      .listJobs({ gioiHan: 4 })
      .then((data) => {
        if (isMounted) {
          setPublicJobs(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPublicJobs([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Việc làm nổi bật</h2>
        <Link href="/jobs" className="text-sm font-medium text-slate-700 hover:underline">
          Xem toàn bộ
        </Link>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <StateCard message="Đang tải việc làm đã duyệt..." />
        ) : null}

        {!isLoading && publicJobs.length === 0 ? (
          <StateCard message="Hiện chưa có việc làm nổi bật." />
        ) : null}

        {publicJobs.map((job) => (
          <PublicJobCard key={job.id} job={job} variant="featured" />
        ))}
      </div>
    </section>
  );
}

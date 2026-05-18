"use client";

import { useEffect, useState } from "react";
import { HomeFooter } from "@/app/components/home/HomeFooter";
import { HomeHeader } from "@/app/components/home/HomeHeader";
import {
  publicJobService,
  type PublicJobSearchMetadata,
  type PublicJobSearchResponse,
  type PublicJobSummary,
  type SearchJobsParams,
} from "@/services/public-job.service";
import { JobsPagination } from "./components/JobsPagination";
import { JobsResultState } from "./components/JobsResultState";
import { JobsSearchFilters } from "./components/JobsSearchFilters";
import { PublicJobCard } from "./components/PublicJobCard";

const DEFAULT_PAGE_SIZE = 12;

// Trang search/list việc làm public.
// Luồng search dùng API backend đã tích hợp Elasticsearch.
export default function JobsPage() {
  const [jobs, setJobs] = useState<PublicJobSummary[]>([]);
  const [metadata, setMetadata] = useState<PublicJobSearchMetadata | null>(null);
  const [searchState, setSearchState] = useState<PublicJobSearchResponse | null>(null);
  const [filters, setFilters] = useState<SearchJobsParams>({
    trang: 0,
    kichThuoc: DEFAULT_PAGE_SIZE,
    tuKhoa: "",
    diaDiem: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSearch = async (params: SearchJobsParams) => {
    setIsLoading(true);
    setError("");
    try {
      const data = await publicJobService.searchJobs(params);
      setSearchState(data);
      setJobs(data.danhSach ?? []);
    } catch {
      setError("Không tải được danh sách việc làm. Vui lòng thử lại.");
      setSearchState(null);
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const [metadataData, searchData] = await Promise.all([
          publicJobService.getSearchMetadata(),
          publicJobService.searchJobs(filters),
        ]);
        if (!isMounted) {
          return;
        }
        setMetadata(metadataData);
        setSearchState(searchData);
        setJobs(searchData.danhSach ?? []);
      } catch {
        if (!isMounted) {
          return;
        }
        setError("Không tải được dữ liệu tìm kiếm việc làm. Vui lòng thử lại.");
        setMetadata(null);
        setSearchState(null);
        setJobs([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmitFilters = async () => {
    const next = { ...filters, trang: 0 };
    setFilters(next);
    await loadSearch(next);
  };

  const handleResetFilters = async () => {
    const next: SearchJobsParams = {
      trang: 0,
      kichThuoc: DEFAULT_PAGE_SIZE,
      tuKhoa: "",
      diaDiem: "",
      nganhNgheId: undefined,
      loaiHinhLamViecId: undefined,
      capDoKinhNghiemId: undefined,
    };
    setFilters(next);
    await loadSearch(next);
  };

  const handlePrevPage = async () => {
    const currentPage = searchState?.trang ?? 0;
    if (currentPage <= 0) {
      return;
    }
    const next = { ...filters, trang: currentPage - 1 };
    setFilters(next);
    await loadSearch(next);
  };

  const handleNextPage = async () => {
    if (!searchState?.conTrangSau) {
      return;
    }
    const currentPage = searchState?.trang ?? 0;
    const next = { ...filters, trang: currentPage + 1 };
    setFilters(next);
    await loadSearch(next);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <HomeHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
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
          value={filters}
          metadata={metadata}
          onChange={setFilters}
          onSubmit={() => void handleSubmitFilters()}
          onReset={() => void handleResetFilters()}
          loading={isLoading}
        />

        <div className="mt-4">
          <JobsResultState loading={isLoading} error={error} empty={!isLoading && !error && jobs.length === 0} />
        </div>

        {!isLoading && !error && jobs.length > 0 ? (
          <div className="space-y-3">
            {jobs.map((job) => (
              <PublicJobCard key={job.id} job={job} />
            ))}
            <JobsPagination
              currentPage={searchState?.trang ?? 0}
              hasNext={Boolean(searchState?.conTrangSau)}
              onPrev={() => void handlePrevPage()}
              onNext={() => void handleNextPage()}
              disabled={isLoading}
            />
          </div>
        ) : null}
      </main>
      <HomeFooter />
    </div>
  );
}

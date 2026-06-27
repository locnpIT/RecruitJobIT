"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  publicJobService,
  type PublicJobSearchMetadata,
  type PublicJobSearchResponse,
  type PublicJobSummary,
  type SearchJobsParams,
} from "@/services/public/public-job.service";

const DEFAULT_PAGE_SIZE = 8;

function parseOptionalNumber(raw: string | null): number | undefined {
  if (!raw) {
    return undefined;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildFiltersFromQuery(searchParams: { get: (key: string) => string | null }): SearchJobsParams {
  return {
    trang: 0,
    kichThuoc: DEFAULT_PAGE_SIZE,
    tuKhoa: searchParams.get("tuKhoa")?.trim() ?? "",
    diaDiem: searchParams.get("diaDiem")?.trim() ?? "",
    nganhNgheId: parseOptionalNumber(searchParams.get("nganhNgheId")),
    loaiHinhLamViecId: parseOptionalNumber(searchParams.get("loaiHinhLamViecId")),
    capDoKinhNghiemId: parseOptionalNumber(searchParams.get("capDoKinhNghiemId")),
  };
}

// Dùng cho màn /jobs: quản lý metadata filter + state search + phân trang từ API.
export function useJobsSearch() {
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const [jobs, setJobs] = useState<PublicJobSummary[]>([]);
  const [metadata, setMetadata] = useState<PublicJobSearchMetadata | null>(null);
  const [searchState, setSearchState] = useState<PublicJobSearchResponse | null>(null);
  const [filters, setFilters] = useState<SearchJobsParams>(buildFiltersFromQuery(searchParams));
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
    const queryFilters = buildFiltersFromQuery(new URLSearchParams(searchParamsKey));

    const bootstrap = async () => {
      try {
        const [metadataData, searchData] = await Promise.all([
          publicJobService.getSearchMetadata(),
          publicJobService.searchJobs(queryFilters),
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
  }, [searchParamsKey]);

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

  return {
    jobs,
    metadata,
    searchState,
    filters,
    isLoading,
    error,
    setFilters,
    handleSubmitFilters,
    handleResetFilters,
    handlePrevPage,
    handleNextPage,
  };
}

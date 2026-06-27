"use client";

import Link from "next/link";
import { HomeFooter } from "@/app/components/home/HomeFooter";
import { HomeHeader } from "@/app/components/home/HomeHeader";
import { StateCard } from "@/app/components/shared/StateCard";
import { Button } from "@/components/ui/Button";
import { PublicJobCard } from "../../components/PublicJobCard";
import { useAiJobsSearch } from "../hooks/useAiJobsSearch";

export function AiJobsPageClient() {
  const aiSearch = useAiJobsSearch();
  const isEmptyPrompt = !aiSearch.prompt && !aiSearch.isLoading;
  const isEmptyResult =
    Boolean(aiSearch.prompt) && !aiSearch.isLoading && !aiSearch.error && aiSearch.jobs.length === 0;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <HomeHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-10">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Search AI
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-slate-950 md:text-3xl">
              Kết quả việc làm theo yêu cầu AI
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {aiSearch.prompt
                ? `Prompt: ${aiSearch.prompt}`
                : "Nhập nội dung tìm kiếm ở Hero trang chủ để AI gợi ý tin phù hợp."}
            </p>
          </div>
          <Button type="button" variant="outline" className="h-10 px-4" onClick={() => history.back()}>
            Quay lại
          </Button>
        </div>

        {aiSearch.isLoading ? (
          <StateCard message="AI đang tìm việc phù hợp trong database..." paddingClassName="p-5" />
        ) : null}

        {aiSearch.error ? (
          <StateCard message={aiSearch.error} tone="error" paddingClassName="p-5" />
        ) : null}

        {isEmptyPrompt ? (
          <StateCard
            message="Chưa có prompt tìm kiếm AI."
            paddingClassName="p-6"
            className="text-slate-600"
          />
        ) : null}

        {isEmptyResult ? (
          <StateCard
            message="AI chưa tìm thấy tin tuyển dụng phù hợp với prompt hiện tại."
            paddingClassName="p-6"
            className="text-slate-600"
          />
        ) : null}

        {!aiSearch.isLoading && !aiSearch.error && aiSearch.jobs.length > 0 ? (
          <div className="space-y-3">
            {aiSearch.jobs.map((job) => (
              <PublicJobCard key={job.id} job={job} />
            ))}
          </div>
        ) : null}

        <div className="mt-6">
          <Link href="/" className="text-sm font-semibold text-[#008080] hover:text-[#006d6d]">
            Về trang chủ để tìm lại
          </Link>
        </div>
      </main>
      <HomeFooter />
    </div>
  );
}

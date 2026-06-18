"use client";

import Link from "next/link";
import { HomeFooter } from "@/app/components/home/HomeFooter";
import { HomeHeader } from "@/app/components/home/HomeHeader";
import { StateCard } from "@/app/components/shared/StateCard";
import { ApplicationStatusBadge } from "@/app/company-admin/applications/components/ApplicationStatusBadge";
import { useMyApplications } from "../hooks/useMyApplications";

export function MyApplicationsPageClient() {
  const { applications, isLoading, error, withdrawingId, handleWithdraw } = useMyApplications();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <HomeHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Candidate</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-slate-950 md:text-3xl">
              Đơn ứng tuyển của tôi
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Theo dõi trạng thái các đơn ứng tuyển bạn đã nộp.
            </p>
          </div>
          <Link
            href="/jobs"
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Tìm việc làm
          </Link>
        </div>

        {isLoading ? <StateCard message="Đang tải đơn ứng tuyển..." paddingClassName="p-5" /> : null}

        {!isLoading && error ? <StateCard message={error} tone="error" paddingClassName="p-5" /> : null}

        {!isLoading && !error && applications.length === 0 ? (
          <StateCard
            message="Bạn chưa có đơn ứng tuyển nào. Hãy tìm việc làm phù hợp và ứng tuyển ngay!"
            tone="muted"
            paddingClassName="p-8"
          />
        ) : null}

        {!isLoading && !error && applications.length > 0 ? (
          <div className="space-y-3">
            {applications.map((app) => {
              const status = app.trangThai?.toUpperCase();
              const canWithdraw = status === "PENDING" || status === "REVIEWING";

              return (
                <div
                  key={app.id}
                  className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/jobs/${app.tinTuyenDungId}`}
                      className="line-clamp-1 text-base font-semibold text-slate-900 hover:underline"
                    >
                      {app.tieuDeTinTuyenDung ?? "Tin tuyển dụng"}
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <ApplicationStatusBadge status={app.trangThai} />
                      {app.ngayTao ? (
                        <span className="text-xs text-slate-500">
                          Nộp lúc {new Date(app.ngayTao).toLocaleString("vi-VN")}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/jobs/${app.tinTuyenDungId}`}
                      className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Xem tin
                    </Link>
                    {canWithdraw ? (
                      <button
                        type="button"
                        disabled={withdrawingId === app.id}
                        onClick={() => handleWithdraw(app.id)}
                        className="inline-flex h-9 items-center justify-center rounded-md border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {withdrawingId === app.id ? "Đang rút..." : "Rút đơn"}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </main>
      <HomeFooter />
    </div>
  );
}

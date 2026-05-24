"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { CompanyAdminCompany, CompanyAdminJob } from "@/services/company-admin/types";
import { JobPreviewContent } from "./job-preview/JobPreviewContent";
import { JobPreviewHero } from "./job-preview/JobPreviewHero";
import { JobPreviewSidebar } from "./job-preview/JobPreviewSidebar";

type JobPreviewModalProps = {
  open: boolean;
  job: CompanyAdminJob | null;
  company: CompanyAdminCompany | null;
  onClose: () => void;
};

export function JobPreviewModal({ open, job, company, onClose }: JobPreviewModalProps) {
  if (!open || !job) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/55 px-4 py-6">
      <div className="mx-auto flex max-h-[calc(100vh-48px)] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-slate-50 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Preview tin tuyển dụng</p>
            <h2 className="mt-1 text-base font-semibold text-slate-950">Giao diện ứng viên sẽ nhìn thấy</h2>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Đóng preview">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="overflow-y-auto">
          <JobPreviewHero job={job} company={company} />

          <section className="grid gap-5 p-5 lg:grid-cols-[1fr_320px]">
            <JobPreviewContent job={job} />
            <JobPreviewSidebar job={job} company={company} />
          </section>
        </div>
      </div>
    </div>
  );
}

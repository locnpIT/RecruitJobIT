"use client";

import { BriefcaseBusiness, CalendarClock, ListChecks, ShieldCheck, Users, UsersRound } from "lucide-react";
import type { CompanyAdminJob } from "@/services/company-admin/types";
import { formatDate } from "./formatters";
import { JobTextPreview } from "./JobTextPreview";

type JobPreviewContentProps = {
  job: CompanyAdminJob;
};

export function JobPreviewContent({ job }: JobPreviewContentProps) {
  const infoItems = [
    { label: "Cấp bậc", value: job.capDoKinhNghiemTen, icon: Users },
    { label: "Ngành nghề", value: job.nganhNgheTen, icon: BriefcaseBusiness },
    { label: "Hình thức làm việc", value: job.loaiHinhLamViecTen, icon: ListChecks },
    { label: "Số lượng tuyển", value: job.soLuongTuyen?.toString(), icon: UsersRound },
    { label: "Hạn nộp", value: formatDate(job.denHanLuc), icon: CalendarClock },
    { label: "Trạng thái", value: job.trangThai, icon: ShieldCheck },
  ];

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-6">
      <section>
        <h3 className="text-lg font-semibold text-slate-950">Thông tin công việc</h3>
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">Kỹ năng yêu cầu</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {job.kyNangs?.length ? (
              job.kyNangs.map((skill) => (
                <span
                  key={skill.id ?? skill.ten}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                >
                  {skill.ten}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-500">Chưa chọn kỹ năng.</span>
            )}
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {infoItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">{item.label}</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{item.value ?? "--"}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <JobTextPreview title="Mô tả công việc" text={job.moTa} />
      <JobTextPreview title="Yêu cầu ứng viên" text={job.yeuCau} />
      <JobTextPreview title="Phúc lợi" text={job.phucLoi} />
    </article>
  );
}


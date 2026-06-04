import {
  Banknote,
  BriefcaseBusiness,
  CalendarClock,
  ListChecks,
  Medal,
  UserRound,
  UsersRound,
} from "lucide-react";
import { RichTextContent } from "@/app/components/shared/RichTextContent";
import type { PublicJobDetail } from "@/services/public/public-job.service";
import { JobSkillsPanel } from "./JobSkillsPanel";

type JobDescriptionPanelProps = {
  job: PublicJobDetail;
};

// Khối nội dung chính của tin tuyển dụng.
// Tách khỏi page để sau này có thể map trực tiếp từ API detail mà không làm page bị dài.
export function JobDescriptionPanel({ job }: JobDescriptionPanelProps) {
  const infoItems = [
    { label: "Mức lương", value: job.mucLuong, icon: Banknote },
    { label: "Cấp bậc", value: job.capDo, icon: UserRound },
    { label: "Ngành nghề", value: job.nganhNghe, icon: BriefcaseBusiness },
    { label: "Kinh nghiệm", value: job.kinhNghiem, icon: CalendarClock },
    { label: "Hình thức làm việc", value: job.loaiHinhLamViec, icon: ListChecks },
    { label: "Số lượng tuyển", value: job.soLuongTuyen, icon: UsersRound },
    { label: "Cập nhật", value: job.capNhatLuc, icon: CalendarClock },
  ];

  return (
    <article className="rounded-lg border border-slate-200 bg-white">
      <div className="space-y-8 p-6">
       

        <section className="border-t border-slate-200 pt-7">
          <h2 className="text-lg font-semibold text-slate-950">Thông tin công việc</h2>
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
              Kỹ năng yêu cầu
            </p>
            <div className="mt-2">
              <JobSkillsPanel skills={job.kyNangs ?? []} />
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {infoItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>


         <JobTextSection icon={BriefcaseBusiness} title="Mô tả công việc" items={job.moTa} />
        <JobTextSection icon={UserRound} title="Yêu cầu ứng viên" items={job.yeuCau} />
        <JobTextSection icon={Medal} title="Phúc lợi" items={job.phucLoi} />

      
      </div>
    </article>
  );
}

type JobTextSectionProps = {
  icon: typeof BriefcaseBusiness;
  title: string;
  items: string[];
};

// Section text dùng lại cho mô tả, yêu cầu và phúc lợi.
// Dùng list bullet thay vì paragraph dài để ứng viên scan thông tin nhanh hơn.
function JobTextSection({ icon: Icon, title, items }: JobTextSectionProps) {
  return (
    <section className="border-b border-slate-200 pb-7 last:border-b-0 last:pb-0">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-800">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <RichTextContent html={items.join("\n")} />
        </div>
      </div>
    </section>
  );
}

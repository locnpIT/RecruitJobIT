import {
  BriefcaseBusiness,
  CalendarClock,
  GraduationCap,
  ListChecks,
  Medal,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import type { PublicJobDetail } from "@/services/public-job.service";
import { JobSkillsPanel } from "./JobSkillsPanel";

type JobDescriptionPanelProps = {
  job: PublicJobDetail;
};

const tabs = ["Mô tả công việc", "Yêu cầu ứng viên", "Phúc lợi", "Thông tin công việc"];

// Khối nội dung chính của tin tuyển dụng.
// Tách khỏi page để sau này có thể map trực tiếp từ API detail mà không làm page bị dài.
export function JobDescriptionPanel({ job }: JobDescriptionPanelProps) {
  const infoItems = [
    { label: "Cấp bậc", value: job.capDo, icon: UserRound },
    { label: "Ngành nghề", value: job.nganhNghe, icon: BriefcaseBusiness },
    { label: "Kinh nghiệm", value: job.kinhNghiem, icon: CalendarClock },
    { label: "Học vấn", value: job.hocVan, icon: GraduationCap },
    { label: "Hình thức làm việc", value: job.loaiHinhLamViec, icon: ListChecks },
    { label: "Số lượng tuyển", value: job.soLuongTuyen, icon: UsersRound },
    { label: "Giới tính", value: job.gioiTinh, icon: UserRound },
    { label: "Cập nhật", value: job.capNhatLuc, icon: CalendarClock },
  ];

  return (
    <article className="rounded-lg border border-slate-200 bg-white">
      <div className="flex gap-8 overflow-x-auto border-b border-slate-200 px-6">
        {tabs.map((tab, index) => (
          <a
            key={tab}
            href={`#section-${index}`}
            className={`whitespace-nowrap border-b-2 py-4 text-sm font-semibold ${
              index === 0
                ? "border-slate-950 text-slate-950"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            {tab}
          </a>
        ))}
      </div>

      <div className="space-y-8 p-6">
        <JobTextSection
          id="section-0"
          icon={BriefcaseBusiness}
          title="Mô tả công việc"
          items={job.moTa}
        />
        <JobTextSection
          id="section-1"
          icon={UserRound}
          title="Yêu cầu ứng viên"
          items={job.yeuCau}
        />
        <JobTextSection id="section-2" icon={Medal} title="Phúc lợi" items={job.phucLoi} />

        <section id="section-3" className="border-t border-slate-200 pt-7">
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

        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 text-slate-600" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Gợi ý khi ứng tuyển</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Cập nhật hồ sơ ứng viên, kỹ năng và chứng chỉ trước khi ứng tuyển để nhà tuyển dụng
                đánh giá nhanh hơn.
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

type JobTextSectionProps = {
  id: string;
  icon: typeof BriefcaseBusiness;
  title: string;
  items: string[];
};

// Section text dùng lại cho mô tả, yêu cầu và phúc lợi.
// Dùng list bullet thay vì paragraph dài để ứng viên scan thông tin nhanh hơn.
function JobTextSection({ id, icon: Icon, title, items }: JobTextSectionProps) {
  return (
    <section id={id} className="border-b border-slate-200 pb-7 last:border-b-0 last:pb-0">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-800">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            {items.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-900" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

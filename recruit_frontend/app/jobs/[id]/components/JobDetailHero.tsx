import Image from "next/image";
import { Clock, MapPin, ShieldCheck, Users } from "lucide-react";
import type { PublicJobDetail } from "@/services/public/public-job.service";

type JobDetailHeroProps = {
  job: PublicJobDetail;
};

// Mỗi lần reload trang, module được load lại và chọn ngẫu nhiên 1 background 1..5.
const HERO_BACKGROUND_IMAGE_URL = `/background-job-detail-${Math.floor(Math.random() * 5) + 1}.png`;

// Hero đầu trang chi tiết job.
// Phần này tập trung vào thông tin ra quyết định nhanh: tiêu đề, công ty,
// địa điểm, hình thức làm việc và tag kỹ năng để ứng viên biết có nên đọc tiếp hay không.
export function JobDetailHero({ job }: JobDetailHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200">
      <Image
        src={HERO_BACKGROUND_IMAGE_URL}
        alt="Background job detail"
        fill
        sizes="100vw"
        className="object-cover object-center"
        priority
      />
      <div className="absolute inset-0 bg-white/58" />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1.12fr_0.88fr] lg:py-10">
        <div>
          <h1 className="mt-8 max-w-3xl text-3xl font-bold leading-tight tracking-[-0.03em] text-slate-950 md:text-5xl">
            {job.tieuDe}
          </h1>

          <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4" />
              {job.congTy}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {job.diaDiem}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {job.loaiHinhLamViec}
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              {job.dangLuc}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {job.the.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="group relative hidden min-h-72 overflow-hidden rounded-lg border border-slate-200 bg-white/95 lg:block">
          {job.logoUrl ? (
            <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-slate-100">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-slate-200/60 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-slate-300/40 blur-3xl" />
              <Image
                src={job.logoUrl}
                alt={`Logo ${job.congTy}`}
                fill
                className="object-contain p-10 transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.72),transparent_44%),radial-gradient(circle_at_82%_82%,rgba(148,163,184,0.2),transparent_42%)]" />
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/50" />
            </div>
          ) : (
            <div
              className="absolute inset-0 grid place-items-center bg-slate-100"
              style={{
                backgroundImage: "url('/background_2.png')",
                backgroundPosition: "center",
                backgroundSize: "cover",
              }}
            >
              <div className="grid h-28 w-28 place-items-center rounded-2xl bg-slate-900 text-3xl font-bold text-white/95 shadow-sm transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
                {job.congTy.slice(0, 1)}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

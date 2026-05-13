import { Clock, Heart, MapPin, Share2, ShieldCheck, Users } from "lucide-react";
import type { PublicJobDetail } from "@/services/public-job.service";

type JobDetailHeroProps = {
  job: PublicJobDetail;
  isFavorite: boolean;
  favoriteLoading: boolean;
  onToggleFavorite: () => void;
};

// Hero đầu trang chi tiết job.
// Phần này tập trung vào thông tin ra quyết định nhanh: trạng thái, tiêu đề, công ty,
// địa điểm, hình thức làm việc và tag kỹ năng để ứng viên biết có nên đọc tiếp hay không.
export function JobDetailHero({ job, isFavorite, favoriteLoading, onToggleFavorite }: JobDetailHeroProps) {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1.12fr_0.88fr] lg:py-10">
        <div>
          <nav className="flex items-center gap-2 text-sm text-slate-500">
            <span>Trang chủ</span>
            <span>/</span>
            <span>Tìm việc</span>
            <span>/</span>
            <span className="text-slate-800">Chi tiết công việc</span>
          </nav>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {job.status}
          </div>

          <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-[-0.03em] text-slate-950 md:text-5xl">
            {job.title}
          </h1>

          <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4" />
              {job.company}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {job.workType}
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              {job.postedAt}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {job.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div
          className="relative hidden min-h-72 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 lg:block"
          style={{
            backgroundImage: "url('/background_2.png')",
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <div className="absolute right-4 top-4 flex gap-2">
            <button
              type="button"
              onClick={onToggleFavorite}
              disabled={favoriteLoading}
              className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm"
              aria-label={isFavorite ? "Bỏ lưu tin tuyển dụng" : "Lưu tin tuyển dụng"}
            >
              <Heart className={`h-5 w-5 ${isFavorite ? "fill-slate-900" : ""}`} />
            </button>
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm"
              aria-label="Chia sẻ tin tuyển dụng"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

type HeroSectionProps = {
  quickFilters: string[];
};

// Hero section của homepage.
// Đây là khối entry-point để người dùng hiểu value proposition và thực hiện tìm việc nhanh.
const benefits = [
  "Doanh nghiệp đã xác minh",
  "Việc làm cập nhật hằng ngày",
  "Theo dõi trạng thái ứng tuyển",
];

export function HeroSection({ quickFilters }: HeroSectionProps) {
  return (
    <section
      className="border-b border-slate-200 bg-slate-100"
      style={{
        backgroundImage: "url('/bannerforhomepage.png')",
        backgroundSize: "cover",
        backgroundPosition: "center center",
      }}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Nền tảng tìm việc dành cho ứng viên
            </p>

            <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight tracking-[-0.03em] text-slate-950 md:text-5xl">
              Tìm công việc phù hợp với kỹ năng của bạn
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Tìm kiếm việc làm theo vị trí, kỹ năng, công ty hoặc địa điểm.
              Cập nhật hồ sơ để nhận gợi ý việc làm phù hợp hơn.
            </p>

            <div className="mt-7 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur-[1px]">
              <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_auto]">
                <input
                  type="text"
                  placeholder="Tên vị trí, kỹ năng hoặc công ty"
                  className="h-12 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
                />

                <input
                  type="text"
                  placeholder="Tỉnh/thành phố"
                  className="h-12 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
                />

                <button
                  type="button"
                  className="h-12 rounded-lg bg-slate-900 px-7 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Tìm việc
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-500">
                  Tìm kiếm nhanh:
                </span>

                {quickFilters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <ul className="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
              {benefits.map((item) => (
                <li
                  key={item}
                  className="rounded-lg border border-slate-200 bg-white/95 px-4 py-3"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
          </div>
      </div>
    </section>
  );
}
